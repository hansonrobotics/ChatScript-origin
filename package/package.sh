#!/usr/bin/env bash
# Copyright (c) 2013-2018 Hanson Robotics, Ltd. 

package_chatscript() {
    local reponame=ChatScript-engine

    mkdir -p $BASEDIR/src
    rsync -r --delete \
        --exclude ".git" \
        --exclude ".git*" \
        --exclude "package" \
        --exclude "LOEBNERVS2010" \
        $BASEDIR/../ $BASEDIR/src/$reponame

    get_version $1

    local name=head-chatscript
    local desc="ChatScript Engine"
    local url="https://api.github.com/repos/hansonrobotics/$reponame/releases"

    fpm -C "${BASEDIR}" -s dir -t deb -n "${name}" -v "${version#v}" --vendor "${VENDOR}" \
        --url "${url}" --description "${desc}" ${ms} \
        --deb-no-default-config-files \
        -d "libcurl3" \
        -p $BASEDIR/${name}_VERSION_ARCH.deb \
        --prefix ${HR_TOOLS_PREFIX}/ChatScript \
        src/$reponame/BINARIES/LinuxChatScript64=BINARIES/ \
        src/$reponame/DICT/BASIC=DICT/ \
        src/$reponame/DICT/ENGLISH=DICT/ \
        src/$reponame/LIVEDATA/SYSTEM=LIVEDATA/ \
        src/$reponame/LIVEDATA/ENGLISH=LIVEDATA/ \
        src/$reponame/RAWDATA \
        src/$reponame/SRC \
        src/$reponame/version.txt \
        src/$reponame/authorizedIP.txt \
        src/$reponame/changes.txt \
        src/$reponame/license.txt \
        src/$reponame/run.sh

    rm -r $BASEDIR/src
}

if [[ $(readlink -f ${BASH_SOURCE[0]}) == $(readlink -f $0) ]]; then
    BASEDIR=$(dirname $(readlink -f ${BASH_SOURCE[0]}))
    source $BASEDIR/common.sh
    source $BASEDIR/config.sh
    set -e

    package_chatscript $@
fi
