import * as k8s from '@pulumi/kubernetes'
import { provider } from './provider'

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
            url: 'https://vault.local.app.danielr1996.de',
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
//kalender, paperless, vaultwarden