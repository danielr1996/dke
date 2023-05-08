import * as k8s from '@pulumi/kubernetes'
import {provider} from '../provider'

// TODO: implement StorageClass: https://longhorn.io/docs/1.4.1/references/examples/#storageclass
export const storageNamespace = new k8s.core.v1.Namespace('storage-namespace',{
    metadata: {
        name: 'longhorn-system',
    }
},{provider})

import './nodepatch'
import './basicauth'
import './release'


