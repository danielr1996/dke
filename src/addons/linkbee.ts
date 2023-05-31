import * as pulumi from '@pulumi/pulumi'
import * as k8s from '@pulumi/kubernetes'
import { provider } from './provider'
import * as htpasswd from 'pulumi-htpasswd';


const config = new pulumi.Config()

const passwd = new htpasswd.Htpasswd('linkbee-htpasswd',{
    algorithm: htpasswd.HtpasswdAlgorithm.Bcrypt,
    entries: [
        {
            username: config.require('linkbee.username'),
            password: config.require('linkbee.password')
        }
    ]
})

export const basicAuthSecret = new k8s.core.v1.Secret('linkbee-basic-auth-secret',{
    metadata: {
        name: 'basic-auth-secret',
        namespace: 'linkbee',
    },
    type: 'Opaque',
    stringData: {
        auth: passwd.result
    }
},{provider})

new k8s.helm.v3.Release("linkbee", {
    chart: "oci://ghcr.io/danielr1996/linkbee",
    version: "0.1.0",
    namespace: 'linkbee',
    atomic: true,
    name: 'linkbee',
    createNamespace: true,
    values: {
        'linkbee-backend': {
            ingress: {
                enabled: true,
                annotations: {
                    'cert-manager.io/cluster-issuer': 'letsencrypt-prod',
                    'nginx.ingress.kubernetes.io/auth-type': 'basic',
                    'nginx.ingress.kubernetes.io/auth-secret': 'basic-auth-secret',
                    'nginx.ingress.kubernetes.io/enable-cors':'true'
                },
                hosts: [{
                    host: `api.${config.require('linkbee.host')}`,
                    paths: [{
                        path: '/',
                        pathType: 'ImplementationSpecific'
                    }]
                }],
                tls: [
                    {
                        secretName: `api.${config.require('linkbee.host')}`,
                        hosts: [`api.${config.require('linkbee.host')}`],
                    }
                ]
            },
            resources: {
                limits: {
                    cpu: '100m',
                    memory: '500Mi'
                },
                requests: {
                    cpu: '100m',
                    memory: '500Mi'
                },
            }
        },
        'linkbee-frontend': {
            environment: {
                APP_HTTP_API: `https://api.${config.require('linkbee.host')}/graphql`,
                APP_WS_API: `wss://api.${config.require('linkbee.host')}/graphql`,
                APP_BASIC_AUTH_USERNAME: config.require('linkbee.username'),
                APP_BASIC_AUTH_PASSWORD: config.require('linkbee.password')
            },
            ingress: {
                enabled: true,
                annotations: {
                    'cert-manager.io/cluster-issuer': 'letsencrypt-prod',
                    'nginx.ingress.kubernetes.io/auth-type': 'basic',
                    'nginx.ingress.kubernetes.io/auth-secret': 'longhorn-system/basic-auth-secret',
                    'nginx.ingress.kubernetes.io/enable-cors':'true'
                },
                hosts: [{
                    host: config.require('linkbee.host'),
                    paths: [{
                        path: '/',
                        pathType: 'ImplementationSpecific'
                    }]
                }],
                tls: [
                    {
                        secretName: config.require('linkbee.host'),
                        hosts: [config.require('linkbee.host')],
                    }
                ]
            },
            resources: {
                limits: {
                    cpu: '10m',
                    memory: '25Mi'
                },
                requests: {
                    cpu: '10m',
                    memory: '25Mi'
                },
            }
        }
    }
},{provider});

const entries = [
    {
        name: 'grafana',
        spec: {
            title: 'Grafana',
            description: 'Kubernetes Monitoring Dashboards',
            url: 'https://grafana.danielrichter.codes',
            icon: {
                location: '/public/img/apple-touch-icon.png'
            }
        }
    },
    {
        name: 'longhorn',
        spec: {
            title: 'Longhorn',
            description: 'Kubernetes Storage Management',
            url: 'https://storage.danielrichter.codes',
            icon: {
                location: 'https://longhorn.io/favicon.png',
                external: true,
            }
        }
    },
    {
        name: 'keycloak',
        spec: {
            title: 'Keycloak',
            description: 'Keycloak Single Sign On',
            url: 'https://sso.danielrichter.codes',
            icon: {
                location: 'https://www.keycloak.org/resources/images/keycloak_icon_512px.svg',
                external: true,
            }
        }
    },
    {
        name: 'vaultwarden',
        spec: {
            title: 'Vaultwarden',
            description: 'Vaultwarden Password Manager',
            url: 'https://vault.danielrichter.codes',
            icon: {
                location: 'https://bitwarden.com/icons/icon-512x512.png',
                external: true,
            }
        }
    },
    {
        name: 'paperless',
        spec: {
            title: 'Paperless NG',
            description: 'Paperless NG Document Management',
            url: 'https://paperless.local.app.danielr1996.de',
            icon: {
                location: 'https://raw.githubusercontent.com/walkxcode/dashboard-icons/main/svg/paperless-ng.svg',
                external: true,
            }
        }
    },
    {
        name: 'paperlessngx',
        spec: {
            title: 'Paperless',
            description: 'Paperless Document Management',
            url: 'https://paperless.danielrichter.codes',
            icon: {
                location: 'https://raw.githubusercontent.com/walkxcode/dashboard-icons/main/svg/paperless-ng.svg',
                external: true,
            }
        }
    },
    {
        name: 'calendar',
        spec: {
            title: 'Calendar',
            description: 'CalDAV Calendar',
            url: 'https://calendar.local.app.danielr1996.de',
            icon: {
                location: 'https://raw.githubusercontent.com/walkxcode/dashboard-icons/main/svg/proton-calendar.svg',
                external: true,
            }
        }
    },
].map(({ name, spec }) => new k8s.apiextensions.CustomResource(name, {
    apiVersion: 'linkbee.danielrichter.codes/v1alpha',
    kind: 'DashboardEntry',
    metadata: { name, },
    spec,
}, { provider }))