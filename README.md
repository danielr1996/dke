# dke
> dke (danis kubernetes engine) is a set of pulumi resources to provision a kubernetes cluster on hetzner cloud

## what you get
dke installs a kubernetes cluster with the following components

- 1 controlplane node
- 3 worker nodes with 40GB of storage each
- hetzner cloud controller manager
- nginx ingress controller
- longhorn storage

## what you dont get (yet)
> please note that this is not a turnkey solution like aws from amazon or doks from digital ocean, it's meant to be a cost effective way to provision a simple cluster that can be easily extended afterward

- control plane high availabilty
- no configuration for number of nodes, amount of storage, etc.

## roadmap
- add configuration for amount of nodes, amount of storage, etc.
- choose between longhorn and hetzner csi driver (https://github.com/hetznercloud/csi-driver)
- controlplane high availability with keepalived (https://github.com/schemen/kubernetes-hetzner-keepalived)
- kubernetes autoscaler (https://github.com/hetznercloud/autoscaler)

# installation
```
npm install
pulumi up --skip-preview
```