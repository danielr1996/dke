import * as k0s from "@ydkn/pulumi-k0s"
import * as pulumi from "@pulumi/pulumi"
import * as fs from 'fs'
import {nodes} from "./hetzner"

const stack = pulumi.getStack()
const project = pulumi.getProject()

const config = new pulumi.Config()

export const cluster = new k0s.Cluster(`${project}-${stack}`,{
    metadata: {name: `${project}-${stack}`},
    spec: {
        hosts: Object.entries({worker: [...nodes.worker,...nodes.storage], controller: nodes.controller}).flatMap(([role,servers])=>(servers).map((node)=>({role,...node}))).map(({role,node})=>({
                role,
                installFlags: ['--enable-cloud-provider=true'],
                ssh: {
                    address: node.ipv4Address,
                    user: 'ubuntu',
                    port: 22,
                    keyPath: config.require('ssh.privatekey'),
                }
            })),
        k0s: {
            version: '1.27.1+k0s.0',
        }
    }  
})

cluster.kubeconfig.apply(kubecfg=>fs.writeFileSync(`${config.require('k0s.kubeconfig')}/${project}-${stack}`,kubecfg))
