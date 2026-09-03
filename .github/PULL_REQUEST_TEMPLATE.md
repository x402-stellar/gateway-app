## Summary
Brief description of the PR and the specific problem or feature it introduces. Reference linked issues using `Fixes #` or `Closes #`.

---

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Refactor / Code Quality (improving internal design without changing behavior)
- [ ] Documentation update

---

## Verification Checklist
- [ ] Monorepo build passes: `pnpm build`
- [ ] TypeScript typechecking passes: `pnpm typecheck`
- [ ] TypeScript unit tests pass: `pnpm test`
- [ ] Go proxy tests pass: `cd proxy && go test -v -race ./...`
- [ ] Added unit tests covering new logic, error paths, or regression cases
- [ ] Readme files and documentation updated if API signatures or configurations changed
