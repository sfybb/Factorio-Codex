import {jest} from "@jest/globals";

jest.mock('__flib__.gui', () => ({
    __esModule: true,
    hook_events: jest.fn(),

    read_action: jest.fn(),
    set_action: jest.fn(),
    get_action: jest.fn(),

    build: jest.fn(),
    add: jest.fn(),
    update: jest.fn(),

    get_tags: jest.fn(),
    set_tags: jest.fn(),
    delete_tags: jest.fn(),
    update_tags: jest.fn(),
}), {
    virtual: true
});

jest.mock('__flib__.on-tick-n', () => ({
    __esModule: true,
    remove: jest.fn(),
    add: jest.fn()
}), {
    virtual: true
});

jest.mock('__flib__.dictionary', () => ({
    __esModule: true,
    set_use_local_storage: jest.fn(),
    init: jest.fn(),
    load: jest.fn(),
    new: jest.fn(),
}), {
    virtual: true
});

jest.mock('__flib__.table', () => ({
    __esModule: true,
    shallow_copy: jest.fn()
}), {
    virtual: true
});