import * as pulumi from '@pulumi/pulumi'
import * as k8s from '@pulumi/kubernetes'
import { provider } from './provider'

const config = new pulumi.Config()

new k8s.helm.v3.Release("vaultwarden", {
    chart: "oci://ghcr.io/danielr1996/vaultwarden",
    version: "0.0.1",
    namespace: 'vaultwarden',
    atomic: true,
    name: 'vaultwarden',
    createNamespace: true,
    values: {
        ingress: {
            enabled: true,
            annotations: {
                'cert-manager.io/cluster-issuer': 'letsencrypt-prod',
            },
            hosts: [{
                host: `${config.require('vaultwarden.host')}`,
                paths: [{
                    path: '/',
                    pathType: 'ImplementationSpecific'
                }]
            }],
            tls: [
                {
                    secretName: `${config.require('vaultwarden.host')}`,
                    hosts: [`${config.require('vaultwarden.host')}`],
                }
            ]
        },
        environment: {
            WEBSOCKET_ENABLED: "true",
            DATABASE_URL: "postgresql://vaultwarden:vaultwarden@vaultwarden-postgresql/vaultwarden",
            SIGNUPS_ALLOWED: false,
            INVITATIONS_ALLOWED: false,
            SHOW_PASSWORD_HINT: false,
            ADMIN_TOKEN: config.require('vaultwarden.admintoken'),
            DOMAIN: `https://${config.require('vaultwarden.host')}`,
        },
        storage: {
            enabled: true,
            class: 'longhorn'
        },
        resources: {
            limits: {
                cpu: '100m',
                memory: '250Mi'
            },
            requests: {
                cpu: '100m',
                memory: '250Mi'
            },
        },
        postgresql: {
            auth: {
                postgresPassword: 'vaultwarden',
                username: 'vaultwarden',
                password: 'vaultwarden',
                database: 'vaultwarden',
            }
        }
    }
},{provider});