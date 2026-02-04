import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

/**
 * NetworkStack
 *
 * Creates the foundational network infrastructure:
 * - VPC with public and private subnets
 * - NAT Gateway for private subnet internet access
 */
export class NetworkStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ============================================
    // VPC (Cost-optimized - No NAT Gateway!)
    // ============================================
    this.vpc = new ec2.Vpc(this, 'FixitVpc', {
      vpcName: 'fixit-vpc',
      maxAzs: 2, // Cost-effective: 2 availability zones
      natGateways: 0, // No NAT Gateway - saves ~$32/month!
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        // Private subnets removed - not needed for public Fargate
      ],
    });

    // ============================================
    // Outputs
    // ============================================
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID',
      exportName: 'FixitVpcId',
    });

    new cdk.CfnOutput(this, 'VpcCidr', {
      value: this.vpc.vpcCidrBlock,
      description: 'VPC CIDR Block',
    });
  }
}
