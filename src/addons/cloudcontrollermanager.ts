import * as pulumi from '@pulumi/pulumi'
import * as k8s from '@pulumi/kubernetes'
import {provider} from './provider'

const config = new pulumi.Config()

const hccmtoken = new k8s.core.v1.Secret('hccm-token',{
    metadata: {
        name: 'hcloud',
        namespace: 'kube-system',
    },
    type: 'Opaque',
    stringData: {
        token: config.require('hccm.token')
    }
},{provider})

const hccm = new k8s.helm.v3.Release("hccm", {
    chart: "hcloud-cloud-controller-manager",
    version: "1.15.0",
    namespace: 'kube-system',
    name: 'hccm',
    createNamespace: true,
    repositoryOpts: {
        repo: "https://charts.hetzner.cloud",
    }
},{provider});
