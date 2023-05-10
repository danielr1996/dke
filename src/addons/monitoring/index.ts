import * as pulumi from '@pulumi/pulumi'
import * as k8s from '@pulumi/kubernetes'
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
        // TODO: read namespace for other resources from release
        namespace: 'observability-system',
        labels: {
            dashboards: 'grafana'
        }
    },
    spec: {
        // TODO: check which values must be set and which can be left default
        config: {
            log: {
                mode: "console"
            },
            auth: {
                disable_login_form: "false"
            },
            security: {
                admin_user: config.require('grafana.user'),
                admin_password: config.require('grafana.password')
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
                    host: config.require('grafana.host'),
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
                    hosts: [config.require('grafana.host')],
                    secretName: config.require('grafana.host')
                }]
            }
        }
    }
}, { dependsOn: grafanaOperator,provider })

const grafanaDatasource = new k8s.apiextensions.CustomResource('grafana-datasource', {
    apiVersion: 'grafana.integreatly.org/v1beta1',
    kind: 'GrafanaDatasource',
    metadata: {
        name: 'prometheus',
        namespace: 'observability-system',
    },
    spec: {
        instanceSelector: {
            matchLabels: {
                dashboards: "grafana"
            }
        },
        datasource: {
            name: 'prometheus',
            type: 'prometheus',
            access: 'proxy',
            basicAuth: false,
            //TODO: generate name from helm release name
            url: 'http://kube-prometheus-prometheus:9090',
            isDefault: true,
            jsonData: {
                tlsSkipVerify: true,
                timeInterval: '5s'
            },
            editable: true,
        }
    }
}, { dependsOn: grafanaOperator, provider })

const dashboards = [
    'k8s-system-api-server.json',
    'k8s-system-coredns.json',
    'k8s-views-global.json',
    'k8s-views-namespaces.json',
    'k8s-views-nodes.json',
    'k8s-views-pods.json',
].map(name=>new k8s.apiextensions.CustomResource(name, {
    apiVersion: 'grafana.integreatly.org/v1beta1',
    kind: 'GrafanaDashboard',
    metadata: {
        name,
        namespace: 'observability-system',
    },
    spec: {
        instanceSelector: {
            matchLabels: {
                dashboards: "grafana"
            }
        },
        url: `https://raw.githubusercontent.com/dotdc/grafana-dashboards-kubernetes/master/dashboards/${name}`
    }
}, { dependsOn: grafanaOperator, provider }))