import * as hcloud from "@pulumi/hcloud";
import * as pulumi from "@pulumi/pulumi"
import * as fs from 'fs'

const stack = pulumi.getStack()
const project = pulumi.getProject()

const config = new pulumi.Config()

const sshkey= new hcloud.SshKey(`sshkey-${stack}`,{
    name: `sshkey-${stack}`,
    publicKey: fs.readFileSync(config.require('ssh.publickey'),{encoding: 'utf-8'})
})

export const controllers = [...Array(1).keys()].map(i=>{
    const node = new hcloud.Server(`${project}-${stack}-controlplane-0`, {
        name: `${project}-${stack}-controlplane-0`,
        serverType: 'cax11',
        image: 'ubuntu-22.04',
        keepDisk: true,
        location: 'fsn1',
        publicNets: [{
            ipv4Enabled: true,
            ipv6Enabled: true,
        }],
        sshKeys: [sshkey.id]
    });
    return {node}
})

export const workers = [...Array(3).keys()].map(i=>{
    const node = new hcloud.Server(`${project}-${stack}-worker-${i}`, {
        name: `${project}-${stack}-worker-${i}`,
        serverType: 'cax11',
        image: 'ubuntu-22.04',
        keepDisk: true,
        location: 'fsn1',
        publicNets: [{
            ipv4Enabled: true,
            ipv6Enabled: true,
        }],
        sshKeys: [sshkey.id]
    });
    
    const volume = new hcloud.Volume(`${project}-${stack}-volume-${i}`, {
        name: `${project}-${stack}-volume-${i}`,
        size: 40,
        serverId: node.id.apply(parseInt),
        automount: true,
        format: "ext4",
    });
    return {node,volume}
})
