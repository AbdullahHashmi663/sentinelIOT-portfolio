# Sentinel-IoT Windows releases

The portfolio expects three real release artifacts:

- Host requirements installer (BAT)
- Client requirements installer (BAT)
- Main dashboard launcher (EXE)

None was found in the original workspace. No fake artifact is included.
After supplying the actual files, configure `src/releases.js` with their
`/downloads/<filename>` URLs and byte sizes. Keep required companion files
with the release package. The existing development launcher uses this
computer's absolute paths and is not a portable requirements installer.

The website never executes these files; visitors choose what to download.
