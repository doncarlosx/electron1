function Class() {
    this.value = 'value'
}

Class.fvalue = 'fvalue1'
Object.getPrototypeOf(Class).fvalue = 'fvalue2'
Object.setPrototypeOf(Class, {fvalue: 'fvalue3'})
Class.prototype.fvalue = 'fvalue4'

const c = new Class()

Object.getPrototypeOf(c).pvalue = 'pvalue'

console.log('c itself:      ', c)
console.log('c constructor: ', c.constructor)
console.log('c prototype:   ', Object.getPrototypeOf(c))
console.log('C prototype:   ', Object.getPrototypeOf(Class))
console.log('c prototype^2: ', Object.getPrototypeOf(Object.getPrototypeOf(c)))
console.log('c prototype^3: ', Object.getPrototypeOf(Object.getPrototypeOf(Object.getPrototypeOf(c))))
console.log('c cprototype:  ', Object.getPrototypeOf(c.constructor))
console.log('c cprototype^2:', Object.getPrototypeOf(Object.getPrototypeOf(c.constructor)))
console.log('C equality:    ', Class === Class)
console.log('C equality:    ', Object.getPrototypeOf(c) === Object.getPrototypeOf(Class))
console.log('C equality:    ', Object.getPrototypeOf(c) === Class)
console.log('lookup test:   ', c.value)
console.log('lookup test:   ', c.pvalue)
console.log('lookup test:   ', c.fvalue)
console.log('C.prototype:   ', Class.prototype)
console.log('c.prototype:   ', c.prototype)

// the prototype property of a function is not the same
// as the prototype of the function. it is the object that
// will serve as the prototype of objects created by new
// with that function.