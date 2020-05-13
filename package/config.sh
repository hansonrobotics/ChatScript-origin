ROS_DIST=kinetic
HR_PREFIX=/opt/hansonrobotics
HR_BIN_PREFIX=$HR_PREFIX/bin
HRTOOL_PREFIX=${HR_PREFIX}/hrtool
HR_ROS_PREFIX=${HR_PREFIX}/ros
HR_TOOLS_PREFIX=$HR_PREFIX/tools
HR_DATA_PREFIX=$HR_PREFIX/data
VOICE_CACHE_DIR=$HOME/.hr/tts/voice
URL_PREFIX=https://github.com/hansonrobotics
GITHUB_STORAGE_URL=https://raw.githubusercontent.com/hansonrobotics/binary_dependency/master
GITHUB_STORAGE_URL2=https://$GITHUB_TOKEN@raw.githubusercontent.com/hansonrobotics/binary_dependency2/master
VENDOR="Hanson Robotics"
PYTHON_PKG_PREFIX=$HR_PREFIX/py2env/lib/python2.7/dist-packages
PYTHON3_PKG_PREFIX=$HR_PREFIX/py3env/lib/python3.6/dist-packages
ROS_PYTHON_PKG_PREFIX=$HR_ROS_PREFIX/lib/python2.7/dist-packages
ROS_PYTHON_PKG_PREFIX2=/opt/ros/$ROS_DIST/lib/python2.7/dist-packages

# These variables are needed to build pocketsphnix
export PKG_CONFIG_PATH=$HR_PREFIX/lib/pkgconfig:$PKG_CONFIG_PATH
export CPLUS_INCLUDE_PATH=$CPLUS_INCLUDE_PATH:$HR_PREFIX/include
export CPATH=$CPLUS_INCLUDE_PATH
