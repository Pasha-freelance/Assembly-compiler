import common from '../Common.js'
import {
    deletePtr,
    getRegType,
    getReplacer,
    is32bitReg,
    is8bitReg,
    isImm,
    isMem,
    t,
    toFixStringWithValidNumberInside
} from "../../LexicalAnalysis/Type.js";
import {checkOnPtr, getImmCapacity, getMemNumber} from "../Size.js";

const calcMemoryDisplacement = (opName) => {
    let memNumber = +getMemNumber(opName)
    const additionalBytes = memNumber === 1 ? 0 : 5
    let replacer = getReplacer(opName)
    if (opName.includes('EBP')) {
        if (replacer === 'SS' || !replacer) return 0x2  + additionalBytes
        return 0x3 + additionalBytes
    } else if (replacer && replacer !== 'DS') {
        return 0x3 + additionalBytes
    } else return 0x2 + additionalBytes
}
const getEqu = (op1, type1, op2, type2) => {
    let res = []
    const isEqu = (opName) => common.hasEqu(opName)
    const handleOperand = (operand, type) => {
        switch (type) {
            case t.mem:
                const opNameWithoutPtr = deletePtr(operand)
                if (isEqu(opNameWithoutPtr)) return operand.replace(opNameWithoutPtr, common.getEquValue(opNameWithoutPtr))
                return operand
            default:
                if (isEqu(operand)) return common.getEquValue(operand)
                return operand
        }
    }
    res[0] = handleOperand(op1, type1)
    if (op2) res[1] = handleOperand(op2, type2)
    return res
}
const getOperandsNames = (operands, amount) => {
    if (amount === 1) return operands.operand1.operandName

    return [operands.operand1.operandName, operands.operand2.operandName]
}


export const STOSD = {
    getSize() {
        return 0x1
    },
}

export const DEC = {
    getSize(operand) {
        let opName = getOperandsNames(operand, 1)
        opName = getEqu(opName, t.reg)[0]
        if(is8bitReg(opName)) return 0x2
        if(is32bitReg(opName)) return 0x1
        return t.errorOfOperand
    }
}
export const MUL = {
    getSize(operand) {
        let opName = getOperandsNames(operand, 1)
        opName = getEqu(opName, t.mem)[0]
        if(!isMem(opName)) return t.errorOfOperand
        if(!checkOnPtr(opName)) return t.needSize
        return calcMemoryDisplacement(opName)
    },
}
export const MOVZX = {
    /**r32/r8*/
    getSize(operands) {
        let [opName1, opName2] = getOperandsNames(operands, 2)
        const equ = getEqu(opName1, t.reg, opName2, t.reg)
        opName1 = equ[0]
        opName2 = equ[1]
        if (!is32bitReg(opName1) || !is8bitReg(opName2)) return t.incompatibleOperands
        return 0x3
    },
}
export const OR = {
    getSize(operands) {
        let [opName1, opName2] = getOperandsNames(operands, 2)
        const equ = getEqu(opName1, t.reg, opName2, t.mem)
        opName1 = equ[0]
        opName2 = equ[1]
        if (!getRegType(opName1) || !isMem(opName2)) return t.errorOfOperand
        if ((is8bitReg(opName1) && opName2.includes('DWORD')) || is32bitReg(opName1) && opName2.includes('BYTE')) return t.incompatibleOperands
        return calcMemoryDisplacement(opName2)
    },
}
export const AND = {
    getSize(operands) {
        let [opName1, opName2] = getOperandsNames(operands, 2)
        const equ = getEqu(opName1, t.mem, opName2, t.reg)
        opName1 = equ[0]
        opName2 = equ[1]
        if (!isMem(opName1) || !getRegType(opName2)) return t.errorOfOperand
        if ((is8bitReg(opName2) && opName1.includes('DWORD')) || is32bitReg(opName2) && opName1.includes('BYTE')) return t.incompatibleOperands
        return calcMemoryDisplacement(opName1)
    },
}
export const TEST = {
    getSize(operands) {
        let [opName1, opName2] = getOperandsNames(operands, 2)
        const equ = getEqu(opName1, t.reg, opName2, t.imm)
        opName1 = equ[0]
        opName2 = equ[1]
        if (!getRegType(opName1) || !isImm(opName2)) return t.errorOfOperand
        const tmp = opName2.includes('-') ? +(toFixStringWithValidNumberInside(opName2.replace('-', '').trim())) - 1 : opName2
        const immCapacity = getImmCapacity(tmp.toString())
        if(opName1 === 'AL'){
            if (immCapacity !== 1) return t.incompatibleOperands
            return 0x2
        }
        if(opName1==='EAX'){
            return 0x5
        }
        if (is8bitReg(opName1)) {
            if (immCapacity !== 1) return t.incompatibleOperands
            return 0x3
        }
        return 0x6
    },
}

export const MOV = {
    getSize(operands) {
        let [opName1, opName2] = getOperandsNames(operands, 2)
        const equ = getEqu(opName1, t.mem, opName2, t.imm)
        opName1 = equ[0]
        opName2 = equ[1]
        if (!isMem(opName1) || !isImm(opName2)) return t.errorOfOperand
        if (!checkOnPtr(opName1)) return t.needSize

        const isByteMem = opName1.includes('BYTE')
        let immCapacity = getImmCapacity(opName2, null, true)
        let immSize = !isByteMem ? 4 : 1
        const tmp = opName2.includes('-') ? +(toFixStringWithValidNumberInside(opName2.replace('-', '').trim())) - 1 : opName2
        immCapacity = getImmCapacity(tmp.toString())
        if (isByteMem && immCapacity !== 1) return t.incompatibleOperands
        return calcMemoryDisplacement(opName1) + immSize
    },
}
export const JZ = {
    getSize(operand) {
        let opName = getOperandsNames(operand, 1)
        opName = getEqu(opName)[0]
        if (!common.hasVariable(opName) && common.hasIdentifier(opName)) {
            if (common.currentSegment === common.identifiers[opName].segment || !common.identifiers[opName]?.segment) {
                const labelDisplacement = common.identifiers[opName].displacement
                const currDisp = common.currentDisplacement
                const additionalBytes = ((labelDisplacement - currDisp) >= 128 || (labelDisplacement - currDisp) <= -127) ? 4 : 0
                if (common.identifiers[opName]?.wasPassed) return 0x2 + additionalBytes
                return 0x6 + additionalBytes
            }
        }
        return t.errorOfOperand
    }
}
export const JMP = {
    name: 'JMP',
    getSize(operand) {
        let opName = getOperandsNames(operand, 1)
        opName = getEqu(opName)[0]
        if (!common.hasVariable(opName) && common.hasIdentifier(opName)) {
            if (common.currentSegment === common.identifiers[opName].segment || !common.identifiers[opName]?.segment) {
                const labelDisplacement = common.identifiers[opName].displacement
                const currDisp = common.currentDisplacement
                const additionalBytes = ((labelDisplacement - currDisp) >= 128 || (labelDisplacement - currDisp) <= -127) ? 3 : 0
                if (common.identifiers[opName]?.wasPassed) return 0x2 + additionalBytes
                return 0x5 + additionalBytes
            }
        }
        return t.errorOfOperand
    }
}
