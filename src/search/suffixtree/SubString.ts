class SubString {
    originalString: string
    start: number

    length: number
    constructor(orgStr: string, start: number, end?: number) {
        end = end != undefined && end < orgStr.length ? end : orgStr.length
        this.originalString = orgStr
        this.start = start
        this.length = end - start
    }

    copy() {
        return new SubString(this.originalString, this.start, this.start+this.length)
    }

    charAt(pos: number): string {
        let absPos = this.start + pos
        if (pos < this.length) return this.originalString.charAt(absPos)
        return ""
    }

    charCodeAt(pos: number): number {
        let absPos = this.start + pos
        if (pos < this.length) return this.originalString.charCodeAt(absPos)
        return NaN
    }

    lengthen(amount: number): void {
        this.length += Math.min(amount, this.originalString.length - this.start)
    }

    shorten(amount: number): void {
        this.length = Math.max(0, this.length - amount)
    }

    substring(start: number, end?: number): SubString {
        end = this.length == 0 ? 0 : (end == undefined || end > this.length ? this.length : 0)
        if (end < 0) end = end > -this.length ? this.length + end : 0

        return new SubString(this.originalString, this.start+start, this.start + end)
    }

    startsWith(searchString: string | SubString, position?: number): boolean {
        position = position ?? 0

        let actStr = typeof searchString == "string" ? searchString : searchString.toString()
        if (this.length-position < searchString.length) return false

        return this.originalString.startsWith(actStr, this.start + position)
    }

    toString(): string {
        return this.originalString.substring(this.start, this.start + this.length)
    }
}

export default SubString