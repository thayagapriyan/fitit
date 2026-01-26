import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

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
 * - ECR repository for Docker images
 * - ECS Cluster with Fargate
 * - Application Load Balancer
 */
export class FrontendStack extends cdk.Stack {
  public readonly loadBalancerDnsName: string;
  public readonly ecrRepository: ecr.Repository;
  public readonly fargateService: ecsPatterns.ApplicationLoadBalancedFargateService;

  constructor(scope: Construct, id: string, props: FrontendStackProps) {
    super(scope, id, props);

    const { vpc, backendApiUrl } = props;

    // ============================================
    // ECR Repository
    // ============================================
    this.ecrRepository = new ecr.Repository(this, 'FrontendRepo', {
      repositoryName: 'fitit-frontend',
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Change to RETAIN for production
      imageScanOnPush: true,
      lifecycleRules: [
        {
          description: 'Keep only last 10 images',
          maxImageCount: 10,
          rulePriority: 1,
        },
      ],
    });

    // ============================================
    // ECS Cluster
    // ============================================
    const cluster = new ecs.Cluster(this, 'FrontendCluster', {
      clusterName: 'fitit-frontend-cluster',
      vpc,
      containerInsightsV2: ecs.ContainerInsights.ENABLED,
    });

    // ============================================
    // Task Definition
    // ============================================
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'FrontendTask', {
      memoryLimitMiB: 512,
      cpu: 256,
      family: 'fitit-frontend',
    });

    // Log group for container logs
    const logGroup = new logs.LogGroup(this, 'FrontendLogGroup', {
      logGroupName: '/ecs/fitit-frontend',
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Container definition
    const container = taskDefinition.addContainer('FrontendContainer', {
      containerName: 'fitit-frontend',
      // Use placeholder image initially - will be replaced by CI/CD
      image: ecs.ContainerImage.fromRegistry('nginx:alpine'),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'fitit-frontend',
        logGroup,
      }),
      environment: {
        // These are passed to the container, but for a static SPA
        // they need to be baked in at build time via Dockerfile ARGs
        VITE_API_BASE_URL: backendApiUrl,
      },
      portMappings: [
        {
          containerPort: 80,
          protocol: ecs.Protocol.TCP,
        },
      ],
      healthCheck: {
        command: ['CMD-SHELL', 'wget --quiet --tries=1 --spider http://localhost/health || exit 1'],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        retries: 3,
        startPeriod: cdk.Duration.seconds(60),
      },
    });

    // ============================================
    // Fargate Service with ALB
    // ============================================
    this.fargateService = new ecsPatterns.ApplicationLoadBalancedFargateService(
      this,
      'FrontendService',
      {
        cluster,
        taskDefinition,
        serviceName: 'fitit-frontend-service',
        publicLoadBalancer: true,
        desiredCount: 2, // High availability
        // Security groups are auto-created by the pattern
        assignPublicIp: false, // Private subnets with NAT
        taskSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        healthCheckGracePeriod: cdk.Duration.seconds(60),
        circuitBreaker: {
          rollback: true, // Auto-rollback on deployment failure
        },
      }
    );

    // Configure health check
    this.fargateService.targetGroup.configureHealthCheck({
      path: '/health',
      healthyHttpCodes: '200',
      interval: cdk.Duration.seconds(30),
      timeout: cdk.Duration.seconds(5),
      healthyThresholdCount: 2,
      unhealthyThresholdCount: 3,
    });

    // Auto-scaling
    const scaling = this.fargateService.service.autoScaleTaskCount({
      minCapacity: 2,
      maxCapacity: 10,
    });

    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    scaling.scaleOnMemoryUtilization('MemoryScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    this.loadBalancerDnsName = this.fargateService.loadBalancer.loadBalancerDnsName;

    // ============================================
    // Outputs
    // ============================================
    new cdk.CfnOutput(this, 'LoadBalancerDnsName', {
      value: this.loadBalancerDnsName,
      description: 'Frontend Load Balancer DNS Name',
      exportName: 'FititFrontendUrl',
    });

    new cdk.CfnOutput(this, 'LoadBalancerUrl', {
      value: `http://${this.loadBalancerDnsName}`,
      description: 'Frontend URL',
    });

    new cdk.CfnOutput(this, 'EcrRepositoryUri', {
      value: this.ecrRepository.repositoryUri,
      description: 'ECR Repository URI',
      exportName: 'FititFrontendEcrUri',
    });

    new cdk.CfnOutput(this, 'EcsClusterName', {
      value: cluster.clusterName,
      description: 'ECS Cluster Name',
    });

    new cdk.CfnOutput(this, 'EcsServiceName', {
      value: this.fargateService.service.serviceName,
      description: 'ECS Service Name',
    });
  }
}
