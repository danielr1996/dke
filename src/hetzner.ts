import * as hcloud from "@pulumi/hcloud";
import * as pulumi from "@pulumi/pulumi"
import * as fs from 'fs'
import * as YAML from 'yaml'

const stack = pulumi.getStack()
const project = pulumi.getProject()

const config = new pulumi.Config()

const serverType = 'cax11'
const image = 'ubuntu-22.04'
const location = 'fsn1'
const volumesize = 40

const pgWorker = new hcloud.PlacementGroup("worker", {
    type: "spread",
});
const pgControlplane = new hcloud.PlacementGroup("controlplane", {
    type: "spread",
});


export const nodes = Object.entries({
    worker: 3,
    controller: 1,
    bastion: 0,
})
.map(([role,count])=>({[role]:[...Array(count).keys()].map(i=>{
     const node = new hcloud.Server(`${project}-${stack}-${role}-${i}`, {
        name: `${project}-${stack}-${role}-${i}`,
        serverType: serverType,
        ...(role === 'worker' ? {placementGroupId: pgWorker.id.apply(parseInt)} : {}),
        ...(role === 'controlplane' ? {placementGroupId: pgControlplane.id.apply(parseInt)} : {}),
        image: image,
        keepDisk: true,
        location: location,
        publicNets: [{
            ipv4Enabled: true,
            ipv6Enabled: true,
        }],
        userData:'#cloud-config\n'+YAML.stringify({
            users: [{
                name: 'ubuntu',
                groups: 'users, sudo',
                shell: '/bin/bash',
                sudo: 'ALL=(ALL) NOPASSWD:ALL',
                ssh_authorized_keys: [fs.readFileSync(config.require('ssh.publickey'),{encoding: 'utf-8'})],
            }],
            package_update: true,
            package_upgrade: true,
        })
    });
    const volume = role !== 'worker' ? undefined : new hcloud.Volume(`${project}-${stack}-volume-${i}`, {
        name: `${project}-${stack}-volume-${i}`,
        size: volumesize,
        serverId: node.id.apply(parseInt),
        automount: true,
        format: "ext4",
    });
    return {node,volume}
})}))
.reduce((a,b)=>({...a,...b}))
