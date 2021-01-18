# configure-credentials

A github action that will set up AWS and Kubernetes credentials on a Github-hosted runner, so that subsequent commands can use them.

It’s a JavaScript action rather than a Docker action because we want to directly modify the home directory of the runner, which isn’t possible if it’s running inside a container.

It is in a public repository so that all of our repos can use it without additional setup. No sensitive information is now, or should ever be, checked in.

Remember to check in the built code when making changes, since the build/ directory is being used directly.
