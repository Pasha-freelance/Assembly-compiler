import * as SegmentRegs from '../ListingCreation/State/Registers.js'
import common from "../ListingCreation/Common.js";
import {has32bitDataInBasicAddress} from "../ListingCreation/Size.js";

export const t = {
    decimal: 'Десяткова константа',
    binary: "Двійкова константа",
    hex: 'Шістнадцяткова константа',
    instruction: 'Інструкція',
    char: 'Один знак',
    userIdentifier: 'Ідентифікатор',
    mnemo: 'Мнемокод',
    dataDirective: 'Директива',
    eightBitRegister: '8-бітний РЗП',
    thirtyTwoBitCommonRegister: '32-бітний РЗП',
    thirtyTwoBitStackRegister: '32-бітний регістр стеку',
    segmentRegister: 'Сегментий регістр',
    sizeType: 'Розмірний тип',
    undef: 'Невизначена команда',
    dataType: 'Розмірність',
    dataTypeOperand: 'DATA TYPE OPERAND',
    errorOfOperand: 'Помилка операнду',
    variablesDuplication: 'Повторення декларації змінних',
    outOfSegmentCommand: 'Команда знаходиться за сегментом данниї або коду',
    userIdentifierDuplication: 'Повторення декларації ідентифікатора',
    undefinedReference: 'Невизначене посилання',
    withoutOperands: 'WITHOUT OPERANDS',
    commandWithOneOperand: 'COMMAND WITH ONE OPERAND',
    incompatibleOperands: 'Операнди несумісні за типом',
    tooBigOperand: 'Операнд занадто великий',
    unclosedSegment: 'Незакритий сегмент',
    needSize: 'Потрібно явно казати розмірність операнду',
    mark: 'Вказівний',
    textConstant: 'Текстова константа',
    reg: 'REG',
    mem: 'MEM',
    imm: 'IMM'
}
export const str = {
    binNULLStr: '00000000'
}

const instructions = ['STOSD', 'DEC', 'MUL', 'MOVZX', 'OR', 'AND', 'TEST', 'MOV', 'JZ', 'JMP']
export const eightBitRegisters = ['AL', 'CL', 'DL', 'BL', 'AH', 'CH', 'DH', 'BH']
export const thirtyTwoBitRegisters = ['EAX', 'ECX', 'EDX', 'EBX', 'ESP', 'EBP', 'ESI', 'EDI']
const segmentRegisters = ['ES', 'CS', 'SS', 'DS', 'FS', 'GS']
const sizeTypes = ['DB', 'DD', 'DW']
const dataDirectives = ['END', 'ENDS', 'SEGMENT', 'EQU']
const dataTypes = ['DWORD', 'BYTE']

const commandsWithNoOperands = ['END', 'ENDS', 'STOSD', 'SEGMENT']
const commandsWithOneOperand = ['DEC', 'MUL', 'JZ', 'JMP', 'DB', 'DD', 'DW', 'EQU']

export const isCommandWithOneOperand = exp => commandsWithOneOperand.includes(exp)
export const isCommandWithNoOperands = exp => commandsWithNoOperands.includes(exp)
export const isInstruction = exp => instructions.includes(exp)
export const isDataType = exp => dataTypes.includes(exp)
export const is8bitReg = exp => eightBitRegisters.includes(exp)
export const is32bitReg = exp => thirtyTwoBitRegisters.includes(exp)
export const isSegmentReg = exp => segmentRegisters.includes(exp)
export const isDataDirective = exp => dataDirectives.includes(exp)
export const isSizeType = exp => sizeTypes.includes(exp)
export const isDec = exp => exp.match(/^\d\d*D?$/i)
export const isBin = exp => exp.match(/^[01][01]+B$/i)
export const isHex = exp => exp.match(/^\d[a-f\d]+H$/i)
export const isMark = exp => exp === 'PTR'
export const isUserIdentifier = exp => exp.length <= 6 && exp.match(/^[a-z]/i)
export const isMnemocode = exp => isInstruction(exp) || isDataDirective(exp) || isSizeType(exp)


export default function defineCommandType(expression) {
    if (isInstruction(expression)) return t.instruction
    if (isSizeType(expression)) return `${t.sizeType}_${(expression === 'DB' && '1') || (expression === 'DW' && '2') || (expression === 'DD' && '4')} `
    if (isDataType(expression)) return `${t.dataType}_${(expression === 'BYTE' && '1') || (expression === 'DWORD' && '4')}`
    if (isDataDirective(expression)) return t.dataDirective
    if (isMark(expression)) return t.mark
    if (is8bitReg(expression)) return t.eightBitRegister
    if (is32bitReg(expression)) return expression === 'ESP' ? t.thirtyTwoBitStackRegister : t.thirtyTwoBitCommonRegister
    if (isSegmentReg(expression)) return t.segmentRegister
    if (isDec(expression)) return t.decimal
    if (isBin(expression)) return t.binary
    if (isHex(expression)) return t.hex
    if (isUserIdentifier(expression)) return t.userIdentifier
    if (expression.length === 1) return t.char
    return t.undef
}
/*For listing*/


export const deleteLastChar = exp => exp.length > 1 ? exp.toString().replace(/(D$|H$|B$)/i, '').trim() : exp
export const deletePtr = operand => operand.replace('BYTE', '').replace('DWORD', '').replace('PTR', '').trim()
/**Returns string with bin or hex number inside,which is valid for using in func eval*/
export const toFixStringWithValidNumberInside = (exp, type) => {
    const str = deleteLastChar(exp)
    if (type === t.binary || isBin(exp.toString())) return `0b${str}`
    if (type === t.hex || isHex(exp.toString())) return `0x${str}`
    return str
}
/**Converts number in hex string*/
export const toHEXStr = number => (+number).toString(16).toUpperCase()

export const hasSegmentReplacement = operand => {
    const register = operand.slice(operand.indexOf('[') + 1, operand.length - 2)
    const replacer = getReplacer(operand)
    return replacer ? !SegmentRegs[replacer]?.regs?.includes(register) : false

}
export const getReplacer = operand => {
    const i = operand.indexOf(':')
    return i !== -1 ? operand.slice(i - 3, i - 1) : null
}

export const getRegType = (operand) => {
    if (is8bitReg(operand)) return t.eightBitRegister
    if (is32bitReg(operand)) return t.thirtyTwoBitCommonRegister
}
export const isMem = (operand) => /\[/i.test(operand) && /]$/i.test(operand) && has32bitDataInBasicAddress(operand)
export const isImm = operand => isBin(operand) || isDec(operand) || isHex(operand) || /[\d+\-*/DHB]+/i.test(operand)




