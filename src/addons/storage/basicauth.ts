import * as pulumi from '@pulumi/pulumi'
import * as k8s from '@pulumi/kubernetes'
import * as htpasswd from 'pulumi-htpasswd';
import {provider} from '../provider'
import { storageNamespace } from '.';

const config = new pulumi.Config()

const passwd = new htpasswd.Htpasswd('htpasswd',{
    algorithm: htpasswd.HtpasswdAlgorithm.Bcrypt,
    entries: [
        {
            username: config.require('storage.username'),
            password: config.require('storage.password')
        }
    ]
})

export const basicAuthSecret = new k8s.core.v1.Secret('basic-auth-secret',{
    metadata: {
        name: 'basic-auth-secret',
        namespace: storageNamespace.metadata.name,
    },
    type: 'Opaque',
    stringData: {
        auth: passwd.result
    }
},{provider})