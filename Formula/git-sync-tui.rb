class GitSyncTui < Formula
  desc "Interactive TUI tool for cross-repo git commit synchronization"
  homepage "https://github.com/KiWi233333/git-sync-tui"
  url "https://registry.npmjs.org/git-sync-tui/-/git-sync-tui-0.1.8.tgz"
  sha256 "3dc924ece662411a58bd47abb18007620a0d9edcc636c203a86dbbef771dbc75"
  license "MIT"

  depends_on "node"

  def install
    system "npm", "install", *std_npm_args
    bin.install_symlink libexec.glob("bin/*")
  end

  test do
    assert_match "git-sync-tui", shell_output("#{bin}/git-sync-tui --help 2>&1", 0)
  end
end
