const { Nanostache } = require("./dist/_index");
const { test } = require("../node-cli/cli");


test('Nanostache variables', it =>
{
    it('should replace variables', assert =>
    {
        const result = Nanostache('Simple {{variable}} test {{ withSpaces }}', {
            variable: 'successful',
            withSpaces: 'spaces'
        });
        assert( result, 'Simple successful test spaces' );
    });

    it('should replace multilines variables', assert =>
    {
        const result = Nanostache(`
            This is a multiline text with
            {{some}} variable {{interpolation}}.
        `, {
            some: "many",
            interpolation: "replacements"
        });
        assert( result, `
            This is a multiline text with
            many variable replacements.
        `);
    });
});

test('Nanostache functions', it =>
{
    it('should call function', assert =>
    {
        const result = Nanostache('Call {{handler}} function', {
            handler: () => 'that'
        });
        assert( result, 'Call that function' );
    });
    it('should keep this', assert =>
    {
        const result = Nanostache('My age is {{handler}}', {
            value: 42,
            handler: function ()
            {
                return this.value;
            }
        });
        assert( result, 'My age is 42' );
    });
});

test('Nanostache ternaries', it =>
{
    it('should replace ternary', assert =>
    {
        const result = Nanostache('this is {{ ternary1 ? ok : not ok }} and {{ ternary2 ? not good : good }}', {
            ternary1: 1,
            ternary2: 0
        });
        assert( result, 'this is ok and good' );
    });
    it('should replace ternary with functions', assert =>
    {
        const result = Nanostache('this is {{ ternary1 ? ok : not ok }} and {{ ternary2 ? not good : good }}', {
            ternary1: () => 'truthy',
            ternary2: () => false
        });
        assert( result, 'this is ok and good' );
    });
});