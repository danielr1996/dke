import * as k8s from '@pulumi/kubernetes'
import {provider} from '../provider'
import {nodes} from "../../hetzner"

const patches = [...nodes.storage, ...nodes.worker].map(({node,volume},i)=>{
    new k8s.core.v1.NodePatch(`patchlabels-${i}`,{
        metadata: {
            name: node.name,
            labels: {
                'node.longhorn.io/create-default-disk': volume ? 'config' : 'false',
            },
            annotations: volume ? {
                'node.longhorn.io/default-disks-config': volume.id.apply(id=>JSON.stringify([{
                    path: `/mnt/HC_Volume_${id}`,
                    allowScheduling: true,
                    name: 'default',
                    tags: ['default'],
                }]))
            } : {}
        }
    },{provider})  
})