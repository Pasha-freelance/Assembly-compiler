import {str} from "../LexicalAnalysis/Type.js";
import common from './Common.js'
import {toHEXStr} from "../LexicalAnalysis/Type.js";
import * as SegmentRegs from './State/Registers.js'

const tab = '\t\t\t\t'
const errorTab = `${tab}\t`
const shortTab = `\t\t`
const LEN = 12
export const addNulls = (exp, len) => `${'0'.repeat((len ?? 8) - exp.toString().length)}${exp}`
export const addF = (exp, len) => `${'F'.repeat((len ?? 8) - exp.toString().length)}${exp}`
export const toFixLen = (str, length) => str.length < length ? `${str}${' '.repeat(length - str.length)}` : str

export const commonTitle = (passageNum) => {
    const date = new Date()
    const localTime = `${addNulls(date.getHours() + 1, 2)}:${addNulls(date.getMinutes(), 2)}:${addNulls(date.getSeconds(), 2)}`
    const localDate = `${addNulls(date.getDate(), 2)}-${addNulls(date.getMonth() + 1, 2)}-${date.getFullYear()}`
    const authorName = `Assembly compiler`
    return `${tab}${authorName}  ${localDate} ${localTime}\n\n${tab}${tab}${passageNum === 1 ? 'First' : 'Second'} Passage\n\n`
}
export const sourceString = (line, index) => `${tab}${index + 1}${shortTab}${line.sourceString}\n`
export const customErrorMsg = (line, index, msgText, cause) => {
    common.setNewError(index + 1, msgText, cause)
    return `${sourceString(line, index)}${errorTab}ERROR : ${msgText}${cause ? ' : ' + cause : ''}\n\n`
}
export const nullDisplacementString = (line, index) => `${tab}${index + 1}  ${str.binNULLStr}${tab}${line.sourceString}`
export const currentDisplacementWithCommandSizeStr = (line, index) => `${tab}${index +1}  ${addNulls(toHEXStr(common.currentDisplacement))}  ${tab}${line.sourceString}`
export const endOfSegmentStr = (line, index) => `${tab}${index + 1}  ${addNulls(toHEXStr(common.currentDisplacement))}${tab}${line.sourceString}`
export const equString = (line,index,value) => `${tab}${index + 1}${shortTab}  = ${value}${shortTab} ${line.sourceString}\n`
/**Second passage*/
export const successString = (line, index, displacement, opCode) => `${tab}${index + 1} ${addNulls(toHEXStr(displacement))}  ${toFixLen(opCode || '', LEN)}${tab}${line.sourceString}\n`

/***Common info*/
const userDefinedSegmentInfo = (name, capacity, size) => `${tab}${toFixLen(name,5)}     ${capacity}    ${addNulls(toHEXStr(size))} \n`
const getUserDefinedSegments = () => {
    let out = `\n\n${tab}  User defined segments\n` + `${tab}Name     Capacity    Size \n`
    for (const item in common.identifiers) {
        if (common.identifiers.hasOwnProperty(item)) {
            const identifier = common.identifiers[item]
            if (identifier.isSegmentName)
                out += userDefinedSegmentInfo(identifier.name, '32-bit', identifier.size)
        }
    }
    return out
}
const getSegmentRegistersInfo = () => {
    let out = `\n\n${tab}  Segment registers info\n` + `${tab}Name     Destination \n`
    for (const item in SegmentRegs) {
        const register = SegmentRegs[item]
        out += `${tab}${register.name}        ${register.getDestiny() ?? 'NOTHING'}\n`
    }
    return out
}


const userIdentifierInfo = (name, type, segment, displacement) => {
    return `${tab}${toFixLen(name, 5)}    ${toFixLen(type, 8)}   ${toFixLen(segment, 5)}${shortTab}${addNulls(toHEXStr(displacement))} \n`
}
const getUserIdentifiersInfo = () => {
    let out = `\n\n${tab}  User identifiers info\n` + `${tab}Name     Type${shortTab}      Displacement \n`
    for (const item in common.identifiers) {
        if (common.identifiers.hasOwnProperty(item)) {
            const identifier = common.identifiers[item]
            if (identifier.isSegmentName)
                out += userIdentifierInfo(identifier.name, 'SEGMENT', '', identifier.displacement)
            if (identifier.isVar)
                out += userIdentifierInfo(identifier.name, identifier?.type || 'BYTE', identifier.segment, identifier.displacement)
            if (identifier.isLabel)
                out += userIdentifierInfo(identifier.name, 'LABEL', identifier.segment, identifier.displacement)
            if(common.hasEqu(identifier.name))
                out += userIdentifierInfo(identifier.name, 'LABEL', identifier.segment, '')
        }
    }
    return out
}

const getAllErrorsInfo = () => {
    let out = `\n${tab}Помилки :`
    common.errors.forEach(e => {
        out += `\n${tab}Помилка виникла в рядку ${e.lineIndex} : ${e.errorText} ${e.cause ? `: ${e.cause}` : ''}`
    })
    if (!common.errors.length) out += ` Немає\n`
    return out
}
export const getCommonInfo = () => getUserDefinedSegments() + getSegmentRegistersInfo() + getUserIdentifiersInfo() + getAllErrorsInfo()