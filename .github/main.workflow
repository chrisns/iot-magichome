workflow "build+push" {
  on = "push"
  resolves = ["Build"]
}

action "Build" {
  uses = "docker://docker:stable"
  args = "build -t $GITHUB_REPOSITORY ."
  env = {
    GITHUB_REPOSITORY = "fo"
  }
}
