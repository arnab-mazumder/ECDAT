# ECDAT Implementation Tasks

## Critical Fixes
- [x] Fix backendRunner.js: python → python3
- [x] Install GitPython + create requirements.txt
- [x] Fix reports/route.js: remove hardcoded static data

## Backend Expansion
- [ ] Expand signatures.py: JS, Go, C/C++, config patterns
- [ ] Create js_scanner.py
- [ ] Create go_scanner.py
- [ ] Create c_scanner.py
- [ ] Create config_scanner.py
- [ ] Expand fix_templates.py: JS, Go, C templates
- [ ] Update config.py: raise cap, scannable files only
- [ ] Update pipeline.py: wire new scanners in

## Verification
- [ ] Run smoke test against test_repos
- [ ] Test GitHub URL scan
- [ ] Confirm frontend API routes return real data
