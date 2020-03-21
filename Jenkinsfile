#!groovy

node {

  // Actions
  def forceCompleteDeploy = false
  try {
    timeout(time: 15, unit: 'SECONDS') {
      forceCompleteDeploy = input(
        id: 'Proceed0', message: 'Force COMPLETE Deployment', parameters: [
        [$class: 'BooleanParameterDefinition', defaultValue: true, description: '', name: 'Please confirm you want to recreate services and deployments']
      ])
    }
  }
  catch(err) { // timeout reached or input false
      // nothing
  }

  // Variables
  def tokens = "${env.JOB_NAME}".tokenize('/')
  def appName = tokens[0]
  def dockerUsername = "${DOCKER_USERNAME}"
  def imageTag = "${dockerUsername}/${appName}:${env.BRANCH_NAME}.${env.BUILD_NUMBER}"

  currentBuild.result = "SUCCESS"

  checkout scm
  properties([pipelineTriggers([[$class: 'GitHubPushTrigger']])])

  try {

    stage ('Build docker') {
      sh("docker -H :2375 build -t ${imageTag} .")
      sh("docker -H :2375 build -t ${dockerUsername}/${appName}:latest .")
    }

    stage ('Run Tests') {
      sh('docker-compose -H :2375 -f docker-compose-test.yml build')
      sh('docker-compose -H :2375 -f docker-compose-test.yml run --rm test')
      sh('docker-compose -H :2375 -f docker-compose-test.yml stop')
    }

    stage('Push Docker') {
      withCredentials([usernamePassword(credentialsId: 'Vizzuality Docker Hub', usernameVariable: 'DOCKER_HUB_USERNAME', passwordVariable: 'DOCKER_HUB_PASSWORD')]) {
        sh("docker -H :2375 login -u ${DOCKER_HUB_USERNAME} -p ${DOCKER_HUB_PASSWORD}")
        sh("docker -H :2375 push ${imageTag}")
        sh("docker -H :2375 push ${dockerUsername}/${appName}:latest")
        sh("docker -H :2375 rmi ${imageTag}")
      }
    }

    stage ("Deploy Application") {
      switch ("${env.BRANCH_NAME}") {

        // Roll out to staging
        case "develop":
          sh("echo Deploying to STAGING cluster")
          sh("kubectl config use-context ${KUBECTL_CONTEXT_PREFIX}_${CLOUD_PROJECT_NAME}_${CLOUD_PROJECT_ZONE}_${KUBE_STAGING_CLUSTER}")
          def service = sh([returnStdout: true, script: "kubectl get deploy ${appName} --namespace=fw || echo NotFound"]).trim()
          if ((service && service.indexOf("NotFound") > -1) || (forceCompleteDeploy)){
            sh("kubectl apply -f k8s/services/")
            sh("kubectl apply -f k8s/staging/")
          }
          sh("kubectl set image deployment ${appName} ${appName}=${imageTag} --record --namespace=fw")
          break

        // Roll out to production
        case "master":
          def userInput = true
          def didTimeout = false
          try {
            timeout(time: 60, unit: 'SECONDS') {
              userInput = input(
                id: 'Proceed1', message: 'Confirm deployment', parameters: [
                [$class: 'BooleanParameterDefinition', defaultValue: true, description: '', name: 'Please confirm you agree with this deployment']
              ])
            }
          }
          catch(err) { // timeout reached or input false
              sh("echo Aborted by user or timeout")
              if('SYSTEM' == user.toString()) { // SYSTEM means timeout.
                  didTimeout = true
              } else {
                  userInput = false
              }
          }
          if (userInput == true && !didTimeout){
            sh("echo Deploying to PROD cluster")
            sh("kubectl config use-context ${KUBECTL_CONTEXT_PREFIX}_${CLOUD_PROJECT_NAME}_${CLOUD_PROJECT_ZONE}_${KUBE_PROD_CLUSTER}")
            def service = sh([returnStdout: true, script: "kubectl get deploy ${appName} --namespace=fw || echo NotFound"]).trim()
            if ((service && service.indexOf("NotFound") > -1) || (forceCompleteDeploy)){
              sh("kubectl apply -f k8s/services/")
              sh("kubectl apply -f k8s/production/")
            }
            sh("kubectl set image deployment ${appName} ${appName}=${imageTag} --record --namespace=fw")
          } else {
            sh("echo NOT DEPLOYED")
            currentBuild.result = 'SUCCESS'
          }
          break

        // Default behavior?
        default:
          echo "Default -> do nothing"
          currentBuild.result = "SUCCESS"
      }
    }
  } catch (err) {

    currentBuild.result = "FAILURE"
    throw err
  }

}
