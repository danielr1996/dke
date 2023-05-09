import * as pulumi from '@pulumi/pulumi'
import * as k8s from '@pulumi/kubernetes'
import * as keycloak from '@pulumi/keycloak'
import { provider } from '../provider'

const config = new pulumi.Config()
const kubePrometheus = new k8s.helm.v3.Release("kube-prometheus", {
    chart: "kube-prometheus",
    version: "8.9.2",
    namespace: 'observability-system',
    atomic: true,
    name: 'kube-prometheus',
    createNamespace: true,
    repositoryOpts: {
        repo: "https://charts.bitnami.com/bitnami",
    },
    values: {
    }
}, { provider });

const grafanaOperator = new k8s.helm.v3.Release("grafana", {
    chart: "oci://ghcr.io/grafana-operator/helm-charts/grafana-operator",
    version: "v5.0.0-rc0",
    namespace: 'observability-system',
    atomic: true,
    name: 'grafana-operator',
    createNamespace: true,
}, { provider });

const grafana = new k8s.apiextensions.CustomResource('grafana', {
    apiVersion: 'grafana.integreatly.org/v1beta1',
    kind: 'Grafana',
    metadata: {
        name: 'grafana',
        namespace: 'observability-system',
        labels: {
            dashboards: 'grafana'
        }
    },
    spec: {
        config: {
            log: {
                mode: "console"
            },
            auth: {
                disable_login_form: "false"
            },
            security: {
                admin_user: 'root',
                admin_password: 'secret'
            }
        },
        ingress: {
            metadata: {
                annotations: {
                    'cert-manager.io/cluster-issuer': 'letsencrypt-prod'
                }
            },
            spec: {
                ingressClassName: 'default',
                rules: [{
                    host: 'grafana.danielrichter.codes',
                    http: {
                        paths: [{
                            backend: {
                                service: {
                                    name: 'grafana-service',
                                    port: {
                                        number: 3000
                                    }
                                }
                            },
                            path: '/',
                            pathType: 'Prefix'
                        }]
                    }
                }],
                tls: [{
                    hosts: ['grafana.danielrichter.codes'],
                    secretName: 'grafana.danielrichter.codes'
                }]
            }
        }
    }
}, { provider })