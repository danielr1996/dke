import * as pulumi from '@pulumi/pulumi'
import * as k8s from '@pulumi/kubernetes'
import {provider} from './provider'

const config = new pulumi.Config()

export const ingress = new k8s.helm.v3.Release("nginx-ingress", {
    chart: "ingress-nginx",
    version: "4.6.0",
    namespace: 'ingress-system',
    name: 'nginx-ingress',
    createNamespace: true,
    atomic: true,
    repositoryOpts: {
        repo: "https://kubernetes.github.io/ingress-nginx",
    },
    values: {
        controller: {
            service: {
                externalTrafficPolicy: 'Cluster',
                annotations: {
                    'load-balancer.hetzner.cloud/location': 'nbg1'
                }
            },
            ingressClassResource: {
                name: 'default',
                default: true
            }
        }
    }
},{provider});

const certmanager = new k8s.helm.v3.Release("certmanager", {
    chart: "cert-manager",
    version: "1.10.1",
    namespace: 'cert-manager',
    name: 'cert-manager',
    createNamespace: true,
    atomic: true,
    repositoryOpts: {
        repo: "https://charts.jetstack.io",
    },
    values: {
        installCRDs: true,
        extraArgs: [
            '--acme-http01-solver-nameservers=9.9.9.9:53,1.1.1.1:53'
        ]
    }
},{provider});
const solvers = [
    {
        http01: {
            ingress: {}
        }
    }
]

export const letsencryptprod = new k8s.apiextensions.CustomResource('letsencrypt-prod', {
    apiVersion: 'cert-manager.io/v1',
    kind: 'ClusterIssuer',
    metadata: {
        name: 'letsencrypt-prod',
    },
    spec: {
        acme: {
            server: "https://acme-v02.api.letsencrypt.org/directory",
            email: config.get('letsencrypt:email'),
            privateKeySecretRef: {
                name: "letsencrypt-prod-private-key"
            },
            solvers
        }
    }
}, {dependsOn: certmanager,provider})

new k8s.apiextensions.CustomResource('letsencrypt-staging', {
    apiVersion: 'cert-manager.io/v1',
    kind: 'ClusterIssuer',
    metadata: {
        name: 'letsencrypt-staging',
    },
    spec: {
        acme: {
            server: "https://acme-staging-v02.api.letsencrypt.org/directory",
            email: config.get('letsencrypt:email'),
            privateKeySecretRef: {
                name: "letsencrypt-staging-private-key"
            },
            solvers
        }
    }
}, {dependsOn: certmanager,provider})
