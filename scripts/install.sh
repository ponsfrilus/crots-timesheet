#!/bin/sh
# Inspired from the https://deno.land/install.sh script:
# Copyright 2019 the Deno authors. All rights reserved. MIT license.
# Usage:
# curl -fsSL https://raw.githubusercontent.com/ponsfrilus/crots-timesheet/script/install.sh | sh

set -e

if [ "$OS" = "Windows_NT" ]; then
	target="x86_64-win.exe"
else
	case $(uname -sm) in
		"Darwin x86_64") target="x86_64-darwin" ;;
		"Darwin arm64") target="aarch64-darwin" ;;
		"Linux aarch64") target="aarch64-linux" ;;
		*) target="x86_64-linux" ;;
	esac
fi

if [ $# -eq 0 ]; then
	crots_uri="https://github.com/ponsfrilus/crots-timesheet/releases/latest/download/crots_${target}"
else
	crots_uri="https://github.com/ponsfrilus/crots-timesheet/releases/download/${1}/crots_${target}"
fi

crots_install="${CROTS_INSTALL:-$HOME/.crots}"
bin_dir="$crots_install/bin"
exe="$bin_dir/crots"

if [ ! -d "$bin_dir" ]; then
	mkdir -p "$bin_dir"
fi

curl --fail --location --progress-bar --output "$exe" "$crots_uri"
chmod +x "$exe"

echo "Crots was installed successfully to $exe\n"
if command -v crots >/dev/null; then
	$bin_dir/crots --version
	echo "Run 'crots --help' to get started"
else
	case $SHELL in
		/bin/zsh) shell_profile=".zshrc" ;;
		*) shell_profile=".bashrc" ;;
	esac
	$bin_dir/crots --version
	echo "Manually add the directory to your \$HOME/$shell_profile (or similar)"
	echo "  export CROTS_INSTALL=\"$crots_install\""
	echo "  export PATH=\"\$CROTS_INSTALL/bin:\$PATH\""
	echo "Run '$exe --help' to get started"
fi
echo
echo "Stuck? https://github.com/ponsfrilus/crots-timesheet"
