import * as k8s from '@pulumi/kubernetes'
import {cluster} from '../k0s'

export const provider = new k8s.Provider('k8s',{kubeconfig: cluster.kubeconfig, enableServerSideApply: true})
