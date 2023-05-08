import * as pulumi from '@pulumi/pulumi'
import * as k8s from '@pulumi/kubernetes'
import * as keycloak from '@pulumi/keycloak'
import {provider as k8sprovider} from './provider'

const config = new pulumi.Config()
const keycloakrelease = new k8s.helm.v3.Release("keycloak", {
    chart: "keycloak",
    version: "14.2.0",
    namespace: 'keycloak-system',
    atomic: true,
    name: 'keycloak',
    createNamespace: true,
    repositoryOpts: {
        repo: "https://charts.bitnami.com/bitnami",
    },
    values: {
        production: true,
        proxy: 'edge',
        ingress: {
            enabled: true,
            tls: true,
            hostname: config.require('keycloak.host'),
            annotations: {
                'cert-manager.io/cluster-issuer': 'letsencrypt-prod'
            },
        },
        service: {
            type: 'ClusterIP'
        },
        auth:{
            adminUser: config.require('keycloak.user'),
            adminPassword: config.require('keycloak.password')
        }
    }
},{provider: k8sprovider});

const provider = new keycloak.Provider('provider',{
    clientId: 'admin-cli',
    url: 'https://sso.danielrichter.codes',
    username: config.require('keycloak.user'),
    password: config.require('keycloak.password'),
    initialLogin: false,
})

new keycloak.Realm('platform',{
    realm: 'platform'
},{provider, dependsOn: [keycloakrelease]})