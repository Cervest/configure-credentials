import { execSync } from "child_process"
import * as fs from "fs"
import * as os from "os"
import * as path from "path"

const shell = (cmd: string): string => {
  try {
    const output = execSync(cmd)
    return output.toString()
  } catch (_err) {
    // execSync will already print the stderr output
    throw "Failed to execute shell command."
  }
}

const setAWSCredentials = (
  awsAccessKeyId: string,
  awsSecretAccessKey: string,
  awsIamRoleName?: string,
  awsAccountId?: string
) => {
  const creds = `
  [default]
  aws_access_key_id=${awsAccessKeyId}
  aws_secret_access_key=${awsSecretAccessKey}
  `
  let conf = `
  [default]
  region=eu-west-1
  `

  if (awsIamRoleName) {
    conf = `
    ${conf}
    
    [profile ${awsIamRoleName}]
    source_profile = default
    role_arn = arn:aws:iam::${awsAccountId}:role/${awsIamRoleName}
    `
  }

  const homeDir = os.homedir()
  const awsPath = path.join(homeDir, ".aws")
  const credPath = path.join(awsPath, "credentials")
  const confPath = path.join(awsPath, "config")

  fs.mkdirSync(awsPath)
  fs.writeFileSync(credPath, creds)
  fs.writeFileSync(confPath, conf)
  console.log("AWS credentials written to ~/.aws/credentials")
}

const dockerECRLogin = (awsAccountId: string) => {
  const loginPassword = shell("aws ecr get-login-password").trim()
  const loginResult = shell(
    `docker login -u AWS -p ${loginPassword} https://${awsAccountId}.dkr.ecr.eu-west-1.amazonaws.com`
  )
  console.log(loginResult)
}

const setKubernetesConfig = (
  awsAccountId: string,
  encodedKubeConfig: string,
  cluster: string
) => {
  const kubeConfig = Buffer.from(encodedKubeConfig, "base64").toString()
  const homeDir = os.homedir()
  const kubePath = path.join(homeDir, ".kube")
  const configPath = path.join(kubePath, "config")

  fs.mkdirSync(kubePath)
  fs.writeFileSync(configPath, kubeConfig)
  shell(
    `kubectl config use-context arn:aws:eks:eu-west-1:${awsAccountId}:cluster/${cluster}`
  )
  console.log("Kubernetes config written to ~/.kube/config")
}

const main = () => {
  const {
    INPUT_AWS_ACCOUNT_ID: awsAccountId,
    INPUT_AWS_ACCESS_KEY_ID: awsAccessKeyId,
    INPUT_AWS_SECRET_ACCESS_KEY: awsSecretAccessKey,
    INPUT_CLUSTER: cluster,
    INPUT_KUBE_CONFIG: encodedKubeConfig,
    INPUT_AWS_IAM_ROLE_NAME: awsIamRoleName,
  } = process.env

  if (!awsAccountId) {
    throw "aws-account-id must be set."
  }
  if (!awsAccessKeyId) {
    throw "aws-access-key-id must be set."
  }
  if (!awsSecretAccessKey) {
    throw "aws-secret-access-key must be set."
  }
  if (!encodedKubeConfig) {
    throw "kube-config must be set."
  }
  if (!cluster) {
    throw "cluster must be set."
  }

  setAWSCredentials(awsAccessKeyId, awsSecretAccessKey, awsIamRoleName, awsAccountId)
  dockerECRLogin(awsAccountId)
  setKubernetesConfig(awsAccountId, encodedKubeConfig, cluster)
}

main()
