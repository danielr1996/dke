import * as pulumi from '@pulumi/pulumi'
import * as k8s from '@pulumi/kubernetes'
import {provider} from '../provider'
import {ingress,letsencryptprod} from "../ingresscontroller"
import { storageNamespace } from '.';
import { basicAuthSecret } from './basicauth';

const config = new pulumi.Config()
const secret = new k8s.core.v1.Secret('longhorn-backup-secret',{
    metadata: {
        name: 'longhorn-backup-secret',
        namespace: storageNamespace.metadata.name,
    },
    type: 'Opaque',
    stringData: {
        'AWS_ACCESS_KEY_ID': config.require('storage.accesskeyid'),
        'AWS_SECRET_ACCESS_KEY': config.requireSecret('storage.accesskey'),
        'AWS_ENDPOINTS': config.require('storage.awsendpoint'),
    }
},{provider})

const longhorn = new k8s.helm.v3.Release("storage", {
    chart: "longhorn",
    version: "1.4.0",
    namespace: storageNamespace.metadata.name,
    name: 'longhorn',
    createNamespace: true,
    repositoryOpts: {
        repo: "https://charts.longhorn.io",
    },
    values: {
        csi: {
          kubeletRootDir: '/var/lib/k0s/kubelet'
        },
        ingress: {
            enabled: true,
            tls: true,
            ingressClassName: ingress.values.apply(ingress=>ingress.controller.ingressClassResource.name),
            host: config.require('storage.ingress'),
            tlsSecret: config.require('storage.ingress'),
            annotations: {
                "cert-manager.io/cluster-issuer": letsencryptprod.metadata.name,
                "nginx.ingress.kubernetes.io/auth-type": "basic",
                "nginx.ingress.kubernetes.io/auth-secret": basicAuthSecret.metadata.name,
                "nginx.ingress.kubernetes.io/auth-realm": "'Authentication Required - foo'"

            }
        },
        defaultSettings: {
            createDefaultDiskLabeledNodes: true,
            backupTarget: config.require('storage.backuptarget'),
            backupTargetCredentialSecret: secret.metadata.name
        }
    }
},{provider});

new k8s.apiextensions.CustomResource('snapshotjob', {
    apiVersion: 'longhorn.io/v1beta1',
    kind: 'RecurringJob',
    metadata: {
        name: 'default-hourly-snapshot',
        namespace: storageNamespace.metadata.name,
    },
    spec: {
        cron: '0 * * * *',
        task: 'snapshot',
        groups: ['default'],
        retain: 3,
        concurrency: 2,
    }
}, {dependsOn: longhorn,provider})

new k8s.apiextensions.CustomResource('backupjob', {
    apiVersion: 'longhorn.io/v1beta1',
    kind: 'RecurringJob',
    metadata: {
        name: 'default-nightly-backup',
        namespace: storageNamespace.metadata.name,
    },
    spec: {
        cron: '20 4 * * *',
        task: 'backup',
        groups: ['default'],
        retain: 10,
        concurrency: 2,
    }
}, {dependsOn: longhorn,provider})