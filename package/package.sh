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
        src/$reponame/BINARIES/LinuxChatScript64=${HR_TOOLS_PREFIX}/ChatScript/BINARIES/ \
        src/$reponame/DICT/BASIC=${HR_TOOLS_PREFIX}/ChatScript/DICT/ \
        src/$reponame/DICT/ENGLISH=${HR_TOOLS_PREFIX}/ChatScript/DICT/ \
        src/$reponame/LIVEDATA/SYSTEM=${HR_TOOLS_PREFIX}/ChatScript/LIVEDATA/ \
        src/$reponame/LIVEDATA/ENGLISH=${HR_TOOLS_PREFIX}/ChatScript/LIVEDATA/ \
        src/$reponame/RAWDATA=${HR_TOOLS_PREFIX}/ChatScript/ \
        src/$reponame/SRC=${HR_TOOLS_PREFIX}/ChatScript/ \
        src/$reponame/version.txt=${HR_TOOLS_PREFIX}/ChatScript/ \
        src/$reponame/authorizedIP.txt=${HR_TOOLS_PREFIX}/ChatScript/ \
        src/$reponame/changes.txt=${HR_TOOLS_PREFIX}/ChatScript/ \
        src/$reponame/license.txt=${HR_TOOLS_PREFIX}/ChatScript/ \
        src/$reponame/run.sh=${HR_TOOLS_PREFIX}/ChatScript/

    rm -r $BASEDIR/src
}

if [[ $(readlink -f ${BASH_SOURCE[0]}) == $(readlink -f $0) ]]; then
    BASEDIR=$(dirname $(readlink -f ${BASH_SOURCE[0]}))
    source $BASEDIR/common.sh
    source $BASEDIR/config.sh
    set -e

    package_chatscript $1
fi
