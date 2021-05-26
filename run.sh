#!/usr/bin/env bash
#
# Run ChatScript
#

BASEDIR=$(dirname $(readlink -f ${BASH_SOURCE[0]}))

show_help() {
cat << EOF
Usage: $0 [--local] [--port|-p <Server PORT>] [--users|-u <USERS DIR>] [--logs|-l <LOGS DIR>] [--topic|-t <TOPIC DIR>] [--tmp <TMP DIR>]
  --local       Run in local mode.
  -p, --port    Server port
  -u, --users   Users directory
  -l, --logs    Logs directory
  -t, --topic   Topic directory
  --tmp         TMP directory
  -h, --help    Show help
EOF
}

abs_path() {
    if [[ ! "$1" = /* ]]; then
        dir=$(pwd)/$1
    else
        dir=$1
    fi
    [[ $dir != '/' ]] && dir=${dir%/}
    echo $dir
}

param=''
while [[ $# > 0 ]]; do
    case "$1" in
        --local)
            param="${param} local"
            shift
            ;;
        --port|-p)
            param="$param port=$2"
            shift
            shift
            ;;
        --users|-u)
            dir=$(abs_path $2)
            param="$param users=$dir"
            [[ ! -d $dir ]] && echo "mkdir $dir" && mkdir -p $dir
            shift
            shift
            ;;
        --logs|-l)
            dir=$(abs_path $2)
            param="$param logs=$dir"
            [[ ! -d $dir ]] && echo "mkdir $dir" && mkdir -p $dir
            shift
            shift
            ;;
        --topic|-t)
            dir=$(abs_path $2)
            param="$param topic=$dir"
            [[ ! -d $dir ]] && echo "mkdir $dir" && mkdir -p $dir
            shift
            shift
            ;;
        --tmp)
            dir=$(abs_path $2)
            param="$param tmp=$dir"
            shift
            shift
            ;;
        --help|-h)
            show_help
            exit 0
            ;;
        *)
            echo "Unknown argument $1"
            show_help
            exit 1
            ;;
    esac
done


OS_VERSION=$(lsb_release --codename --short)
if [[ $OS_VERSION == 'focal' ]]; then
    ENGINE=BINARIES/LinuxChatScript64-curl4
else
    ENGINE=BINARIES/LinuxChatScript64
fi

cd $BASEDIR
while true;
do
    echo "Start at $(date)"
    $ENGINE $param
    echo "ChatScript is crashed. Restarting"
    sleep 1
done
