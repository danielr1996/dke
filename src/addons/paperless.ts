import * as pulumi from '@pulumi/pulumi'
import * as k8s from '@pulumi/kubernetes'
import { provider } from './provider'

const config = new pulumi.Config()

new k8s.helm.v3.Release("paperless", {
    chart: "oci://ghcr.io/danielr1996/paperlessngx",
    version: "0.1.1",
    namespace: 'paperless',
    atomic: true,
    name: 'paperless',
    createNamespace: true,
    values: {
        paperlessngx: {
            ingress: {
                enabled: true,
                annotations: {
                    'cert-manager.io/cluster-issuer': 'letsencrypt-prod',
                },
                hosts: [{
                    host: `${config.require('paperless.host')}`,
                    paths: [{
                        path: '/',
                        pathType: 'ImplementationSpecific'
                    }]
                }],
                tls: [
                    {
                        secretName: `${config.require('paperless.host')}`,
                        hosts: [`${config.require('paperless.host')}`],
                    }
                ]
            },
            environment: {
                PAPERLESS_SECRET_KEY: config.require('paperless.secret'),
                PAPERLESS_URL: 'https://paperless.danielrichter.codes',
                PAPERLESS_REDIS: 'redis://:paperless@paperless-redis-master:6379',
                PAPERLESS_DB_HOST: 'paperless-postgresql-hl',
                PAPERLESS_ADMIN_USER: config.require('paperless.user'),
                PAPERLESS_ADMIN_PASSWORD: config.require('paperless.password'),
                PAPERLESS_FILENAME_FORMAT: '{created}-{original_name}',
                PAPERLESS_FILENAME_FORMAT_REMOVE_NONE: 'True'
            },
            storage: {
                enabled: true,
                class: 'longhorn'
            },
            resources: {
                limits: {
                    cpu: '500m',
                    memory: '500Mi'
                },
                requests: {
                    cpu: '500m',
                    memory: '500Mi'
                },
            },
        },
        postgresql: {
            auth: {
                postgresPassword: 'paperless',
                username: 'paperless',
                password: 'paperless',
                database: 'paperless',
            }
        },
        redis: {
            architecture: 'standalone',
            auth: {
                password: 'paperless'
            },
            master: {
                persistence: {
                    enabled: false
                }
            },
            replica: {
                persistence: {
                    enabled: false
                }
            }
        }
    }
},{provider});