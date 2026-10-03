if [ -e $HOME/prd ]
then
    export PRD=$HOME/prd
else
    export PRD=$HOME
fi

export SRC=$PRD/src
DOTDIR=$SRC/dots
MAPDIR=$DOTDIR


# set PATH so it includes user's private bin if it exists
if [ -d "$HOME/bin" ] ; then
    PATH="$HOME/bin:$PATH"
fi

# set PATH so it includes user's private bin if it exists
if [ -d "$HOME/.local/bin" ] ; then
    PATH="$HOME/.local/bin:$PATH"
fi

. "$HOME/.cargo/env"

unset LC_ALL
export LANG=en_GB.UTF-8
export LC_CTYPE=en_GB.UTF-8
. "/home/ieremius/.deno/env"
