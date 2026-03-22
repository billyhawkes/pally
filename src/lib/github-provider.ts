export function isGithubProviderConfigured() {
  return Boolean(
    process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET,
  );
}
