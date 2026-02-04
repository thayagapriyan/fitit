import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as ecsPatterns from "aws-cdk-lib/aws-ecs-patterns";
import * as logs from "aws-cdk-lib/aws-logs";
import { Construct } from "constructs";

/**
 * FrontendStackProps
 */
export interface FrontendStackProps extends cdk.StackProps {
  vpc: ec2.IVpc;
  backendApiUrl: string;
}

/**
 * FrontendStack
 *
 * Deploys the React SPA frontend as:
 * - ECR repository for Docker images (build & push manually via script)
 * - ECS Cluster with Fargate
 * - Application Load Balancer
 * 
 * Workflow:
 * 1. Run scripts/build-and-push.ps1 to build image and push to ECR
 * 2. Run cdk deploy to update ECS with the new image
 */
export class FrontendStack extends cdk.Stack {
  public readonly loadBalancerDnsName: string;
  public readonly ecrRepository: ecr.Repository;
  public readonly fargateService: ecsPatterns.ApplicationLoadBalancedFargateService;

  constructor(scope: Construct, id: string, props: FrontendStackProps) {
    super(scope, id, props);

    const { vpc } = props;

    // Get image tag from context or use 'latest'
    const imageTag = this.node.tryGetContext('imageTag') || 'latest';

    // ============================================
    // ECR Repository
    // ============================================
    this.ecrRepository = new ecr.Repository(this, "FrontendRepo", {
      repositoryName: "fixit-frontend",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      imageScanOnPush: true,
      lifecycleRules: [
        {
          description: "Keep only last 10 images",
          maxImageCount: 10,
          rulePriority: 1,
        },
      ],
    });

    // ============================================
    // ECS Cluster
    // ============================================
    const cluster = new ecs.Cluster(this, "FrontendCluster", {
      clusterName: "fixit-frontend-cluster",
      vpc,
      containerInsightsV2: ecs.ContainerInsights.ENABLED,
    });

    // ============================================
    // Task Definition
    // ============================================
    const taskDefinition = new ecs.FargateTaskDefinition(this, "FrontendTask", {
      memoryLimitMiB: 512,
      cpu: 256,
      family: "fixit-frontend",
    });

    // Log group for container logs
    const logGroup = new logs.LogGroup(this, "FrontendLogGroup", {
      logGroupName: "/ecs/fixit-frontend",
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Container definition - Use ECR repository image
    // Image must be pushed via build-and-push script before deploying
    const container = taskDefinition.addContainer("FrontendContainer", {
      containerName: "fixit-frontend",
      image: ecs.ContainerImage.fromEcrRepository(this.ecrRepository, imageTag),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: "fixit-frontend",
        logGroup,
      }),
      portMappings: [
        {
          containerPort: 80,
          protocol: ecs.Protocol.TCP,
        },
      ],
      healthCheck: {
        command: [
          "CMD-SHELL",
          "wget --quiet --tries=1 --spider http://localhost/ || exit 1",
        ],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(10),
        retries: 5,
        startPeriod: cdk.Duration.seconds(120),
      },
    });

    // ============================================
    // Fargate Service with ALB
    // ============================================
    this.fargateService = new ecsPatterns.ApplicationLoadBalancedFargateService(
      this,
      "FrontendService",
      {
        cluster,
        taskDefinition,
        serviceName: "fixit-frontend-service",
        publicLoadBalancer: true,
        desiredCount: 1,
        assignPublicIp: true,
        taskSubnets: {
          subnetType: ec2.SubnetType.PUBLIC,
        },
        healthCheckGracePeriod: cdk.Duration.seconds(120),
        circuitBreaker: {
          rollback: true,
        },
      }
    );

    // Configure ALB health check
    this.fargateService.targetGroup.configureHealthCheck({
      path: "/",
      healthyHttpCodes: "200,304",
      interval: cdk.Duration.seconds(30),
      timeout: cdk.Duration.seconds(10),
      healthyThresholdCount: 2,
      unhealthyThresholdCount: 5,
    });

    // Fix minHealthyPercent warning
    const cfnService = this.fargateService.service.node
      .defaultChild as ecs.CfnService;
    cfnService.addPropertyOverride(
      "DeploymentConfiguration.MinimumHealthyPercent",
      100
    );

    // Auto-scaling
    const scaling = this.fargateService.service.autoScaleTaskCount({
      minCapacity: 1,
      maxCapacity: 4,
    });

    scaling.scaleOnCpuUtilization("CpuScaling", {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    scaling.scaleOnMemoryUtilization("MemoryScaling", {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    this.loadBalancerDnsName =
      this.fargateService.loadBalancer.loadBalancerDnsName;

    // ============================================
    // Outputs
    // ============================================
    new cdk.CfnOutput(this, "LoadBalancerDnsName", {
      value: this.loadBalancerDnsName,
      description: "Frontend Load Balancer DNS Name",
      exportName: "FititFrontendUrl",
    });

    new cdk.CfnOutput(this, "LoadBalancerUrl", {
      value: `http://${this.loadBalancerDnsName}`,
      description: "Frontend URL",
    });

    new cdk.CfnOutput(this, "EcrRepositoryUri", {
      value: this.ecrRepository.repositoryUri,
      description: "ECR Repository URI",
      exportName: "FixitFrontendEcrUri",
    });

    new cdk.CfnOutput(this, "EcsClusterName", {
      value: cluster.clusterName,
      description: "ECS Cluster Name",
    });

    new cdk.CfnOutput(this, "EcsServiceName", {
      value: this.fargateService.service.serviceName,
      description: "ECS Service Name",
    });
  }
}
