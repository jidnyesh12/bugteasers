FROM ghcr.io/engineer-man/piston@sha256:2f66b7456189c4d713aa986d98eccd0b6ee16d26c7ec5f21b30e942756fd127a

RUN sed -i "s/app.use(body_parser.json());/app.use(body_parser.json({ limit: '16mb' }));/" /piston_api/src/index.js \
    && grep -q "limit: '16mb'" /piston_api/src/index.js \
    && sed -i "s/proc.stdin.destroy();/proc.stdin.on('error', () => {});/" /piston_api/src/job.js \
    && grep -q "proc.stdin.on('error'" /piston_api/src/job.js \
    && ! grep -q "proc.stdin.destroy()" /piston_api/src/job.js

ENV PISTON_OUTPUT_MAX_SIZE=8388608 \
    PISTON_RUN_TIMEOUT=10000 \
    PISTON_RUN_CPU_TIME=10000 \
    PISTON_COMPILE_TIMEOUT=20000 \
    PISTON_COMPILE_CPU_TIME=20000 \
    PISTON_MAX_CONCURRENT_JOBS=64

HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=6 \
    CMD node -e "require('http').get('http://127.0.0.1:2000/api/v2/runtimes', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"
