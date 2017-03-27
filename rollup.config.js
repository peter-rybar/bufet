import typescript from 'rollup-plugin-typescript';
import replace from 'rollup-plugin-replace'
// import uglify from 'rollup-plugin-uglify';

const pkg = require('./package.json');

export default {
    entry: './src/main/main.ts',
    plugins: [
        typescript({
            typescript: require('typescript')
        }),
        replace({
            '@VERSION@': pkg.version
        })
        // uglify()
    ],
    globals: {
        // 'jquery': 'jQuery'
    },
    external: Object.keys(pkg.dependencies),
    targets: [
        {
            dest: './dist/' + pkg.name + '.js',
            // format: 'iife',
            format: 'umd',
            moduleName: pkg.name,
            sourceMap: true
        // },
        // {
        //     dest: './dist/lib/' + pkg.name + '.js',
        //     format: 'es',
        //     sourceMap: true
        }
    ]
}
