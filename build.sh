#!/bin/bash

cd "$(dirname "$0")"

mod_name=$(cat ./info.json | python3 -c "import sys, json; print(json.load(sys.stdin)['name'])")
release_version=$(cat ./info.json | python3 -c "import sys, json; print(json.load(sys.stdin)['version'])")

# Run unit tests
echo "Running unit tests (mod version: $release_version)"
lua ./test_suite.lua -v

if test $? -ne 0
then
    echo "Unit tests failed! Aborting build!"
    exit 1
fi

echo ""
echo "Generating Changelog.md from changelog.txt ..."

changelog_md="# Changelog"

IFS=''
while read line; do
    if [[ $line =~ [0-9]+\.[0-9]+\.[0-9]+ ]]; then
        #echo "  - Version: $BASH_REMATCH"
        changelog_md="$changelog_md\n  - Version: $BASH_REMATCH"
    elif [[ $line =~ [\ ]{2}[a-zA-Z] ]]; then
        #[[ $line =~ [a-zA-Z]+.* ]] && echo "    - $BASH_REMATCH"
        [[ $line =~ [a-zA-Z]+.* ]] && changelog_md="$changelog_md\n    - $BASH_REMATCH"
    elif  [[ $line =~ [\ ]{4} ]]; then
        #[[ $line =~ [a-zA-Z]+.* ]] && echo "        - $BASH_REMATCH"
        [[ $line =~ [a-zA-Z]+.* ]] && changelog_md="$changelog_md\n        - $BASH_REMATCH"
    fi
done < "changelog.txt"
printf "$changelog_md" > Changelog.md
git add Changelog.md
git commit -m "Changelog for release $release_version"

echo "Creating git tag \"release-$release_version\"..."
git tag -a "release-$release_version" -m "Release v$release_version"


echo "Building mod zip..."
printf -v mod_build_file_name "%s_%s.zip" "$mod_name" "$release_version"


files=(
    "info.json"
    "changelog.txt"
    "thumbnail.png"
    "settings.lua"
    "settings-updates.lua"
    "settings-final-fixes.lua"
    "settings-final-fixes.lua"
    "data.lua"
    "data-updates.lua"
    "data-final-fixes.lua"
    "data-final-fixes.lua"
    "control.lua"
)

folders=(
    "locale"
    "scenarios"
    "campaigns"
    "tutorials"
    "migrations"
    
    "scripts"
    "graphics"
)

mod_dir="factorio-codex"
ln -s ./ "$mod_dir"


folders_exp=()
for E in "${folders[@]}"; do
    dir="./$mod_dir/${E}/"

    if [ -d "${E}" ]; then
        folders_exp+=("'$dir'")
    fi
done

files_exp=()
for E in "${files[@]}"; do
    file="./$mod_dir/${E}"
    
    if [ -f "${E}" ]; then
        files_exp+=("'$file'")
    fi
done


if [ -f "$mod_build_file_name" ]; then
    echo "Removing previous build for this version"
    rm "$mod_build_file_name"
fi

# wtf why does this work but without eval it doesn't?
eval $(echo zip -r "$mod_dir/$mod_build_file_name" "${files_exp[@]}" "${folders_exp[@]}")
#zip -r "$mod_dir/$mod_build_file_name" ${files_exp[@]} ${folders_exp[@]}

rm "$mod_dir"
