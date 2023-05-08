import * as k0s from "@ydkn/pulumi-k0s"
import * as pulumi from "@pulumi/pulumi"
import * as fs from 'fs'
import {controllers, workers} from "./hetzner"

const stack = pulumi.getStack()
const project = pulumi.getProject()

const config = new pulumi.Config()

export const cluster = new k0s.Cluster(`${project}-${stack}`,{
    metadata: {name: `${project}-${stack}`},
    spec: {
        hosts: [
                ...controllers.map(v=>({...v,role: 'controller'})),
                ...workers.map(v=>({...v,role: 'worker'})),
            ].map(({node,role})=>({
                role,
                installFlags: ['--enable-cloud-provider=true'],
                ssh: {
                    address: node.ipv4Address,
                    user: 'root',
                    port: 22,
                    keyPath: config.require('ssh.privatekey')
                }
            })),
        k0s: {
            version: '1.26.3+k0s.0'
        }
    }  
})

cluster.kubeconfig.apply(config=>fs.writeFileSync('kubeconfig',config))
