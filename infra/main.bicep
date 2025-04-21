@description('The name for the static web app')
param appName string = 'trollr-app-${uniqueString(resourceGroup().id)}'

@minLength(1)
@description('The name of your environment')
param environmentName string = 'trollr'

@description('The location for all resources')
param location string = resourceGroup().location

var staticWebAppName = empty(appName) ? 'trollr-app-${uniqueString(resourceGroup().id)}' : appName

resource staticWebApp 'Microsoft.Web/staticSites@2022-03-01' = {
  name: staticWebAppName
  location: location
  sku: {
    name: 'Standard'
    tier: 'Standard'
  }
  tags: {
    'azd-service-name': 'web'
  }
  properties: {
    stagingEnvironmentPolicy: 'Enabled'
    allowConfigFileUpdates: true
    provider: 'Custom'
    buildProperties: {
      appLocation: '/'
      apiLocation: ''
      outputLocation: '.next'
    }
  }
}

output STATIC_WEB_APP_NAME string = staticWebApp.name
output AZURE_LOCATION string = location
output STATIC_WEB_APP_URI string = staticWebApp.properties.defaultHostname
