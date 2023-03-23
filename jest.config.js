/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    moduleNameMapper: {
        "/src/(.*)": "<rootDir>/src/$1"
    },
    modulePaths: [
        "<rootDir>/src"
    ],
    moduleDirectories: [
        "src",
        "node_modules"
    ],
}