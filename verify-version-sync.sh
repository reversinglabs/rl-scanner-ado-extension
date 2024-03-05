#! /bin/bash

DIR="task-rl-scanner"

COUNT=$(
    (
        cat vss-extension.json |
        jq -r '.version'

        cat ${DIR}/task.json |
        jq -r '[ .version.Major, .version.Minor, .version.Patch ] |
        join(".")'
    ) |
    sort |
    uniq |
    wc -l
)

if [ "$COUNT" != 1 ]
then
    echo "ERROR: the version strings are ot in sync"

    echo -n "vss-extension.json: "
    cat vss-extension.json |
    jq -r '.version'

    echo -n "${DIR}/task.json: "
    cat ${DIR}/task.json |
    jq -r '[ .version.Major, .version.Minor, .version.Patch ] | join(".")'

    exit 1
fi
