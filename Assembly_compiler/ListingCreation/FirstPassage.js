import {
    isBin,
    isDec,
    isHex,
    t,
    toFixStringWithValidNumberInside,
    toHEXStr
} from "../LexicalAnalysis/Type.js";
import {
    addNulls,
    currentDisplacementWithCommandSizeStr,
    customErrorMsg,
    endOfSegmentStr,
    equString,
    nullDisplacementString,
    sourceString
} from "./Templates.js";
import common from './Common.js'
import {defineVariableSize, getImmCapacity, operandsCalc} from "./Size.js";
import * as Commands from './State/Commands.js'
import * as Regs from './State/Registers.js'
import {isMem} from "../LexicalAnalysis/Type.js";

export const isBeginOfSegment = line => line?.mnemocode?.Lexem === 'SEGMENT'
export const isEndOfSegment = line => line?.mnemocode?.Lexem === 'ENDS'
export const isEndOfProgramme = line => line.sourceString.trim().toUpperCase() === 'END'
export const isVarDeclaration = line => line?.mnemocode?.Lexem === 'DB' || line?.mnemocode?.Lexem === 'DW' || line?.mnemocode?.Lexem === 'DD'
export const isEQU = line => line?.mnemocode?.Lexem === 'EQU'

function handleErrors(line, index) {
    /**Errors handling**/
    if (line.error)
        return customErrorMsg(line, index, line.errorText)

    /**If there was a duplication of some user identifiers*/
    if (common.identifiers[line?.label?.Lexem]?.wasPassed)
        return customErrorMsg(line, index, t.userIdentifierDuplication, line?.label.Lexem)

    /**If there was an undefined reference to some label or variable*/
    if (line.userIdentifier
        && line.userIdentifier !== line.label?.Lexem
        && !common.hasIdentifier(line.userIdentifier)
        && line.mnemocode.Lexem !== 'EQU')
        return customErrorMsg(line, index, t.undefinedReference, line.userIdentifier)

    return false
}


export default function firstPassage(line, index) {
    try {
        let prevDisplacement = common.currentDisplacement
        let out = handleErrors(line, index)
        if (out) return {str: out}

        if (isEndOfProgramme(line)) {
            if (common.currentSegment !== '')
                return {str: customErrorMsg(line, index, t.unclosedSegment, common.currentSegment), end: true}

            return {str: sourceString(line, index), end: true}
        }

        /**If there wasn`t any useful commands in the line or it is the end of programme**/
        if (!line.isUseful)
            return {str: sourceString(line, index), prevDisplacement: ''}

        /**If there was some useful commands in line**/

        //If it is the begin of the data or code segment
        if (isBeginOfSegment(line)) {
            if (common.currentSegment !== '') return {str: customErrorMsg(line, index, t.unclosedSegment, common.currentSegment)}
            if (common.segmentCounter === 1) {
                Regs['DS'].setDestiny(line.label.Lexem)
                common.segmentCounter++
            } else {
                Regs['CS'].setDestiny(line.label.Lexem)
                common.segmentCounter++
            }
            common.nullifyDisplacement()
            common.setCurrentSegment(line.label.Lexem)
            common.setIsSegmentName(line.label.Lexem)
            return {str: nullDisplacementString(line, index), prevDisplacement}
        }

        //If it is the end of data or code segment
        if (isEndOfSegment(line)) {
            out = endOfSegmentStr(line, index)
            common.setSegmentSize(line.label.Lexem)
            common.nullifyDisplacement()
            common.nullifySegment()
            return {str: out, prevDisplacement}
        }


        //If the line contains only mark
        if (line.isMark) {
            common.updateIdentifierInfo(line.label.Lexem)
            common.setIsLabel(line.label.Lexem)
            return {str: currentDisplacementWithCommandSizeStr(line, index, ''), prevDisplacement}
        }


        //If there is some code away from code or data segment
        if (common.currentSegment === '')
            return {str: customErrorMsg(line, index, t.outOfSegmentCommand)}

        //If it was directive EQU

        if (isEQU(line)) {
            const opName = line.operands.operand1.operandName
            const opNameWithoutMinus = opName.replace('-', '').trim()
            if (isDec(opNameWithoutMinus) || isBin(opNameWithoutMinus) || isHex(opNameWithoutMinus)) {
                let capacity = getImmCapacity(opNameWithoutMinus)
                capacity === 4 ? capacity = 8 : capacity = 4
                let value = addNulls(toHEXStr(toFixStringWithValidNumberInside(opNameWithoutMinus)), capacity)
                if (opName.includes('-')) value = `-${value}`
                common.updateIdentifierInfo(line.label.Lexem)
                common.setNewEqu(line.label.Lexem, opName, value + 'H')
                return {str: equString(line, index, value)}
            } else if (isMem(opName)) {
                common.updateIdentifierInfo(line.label.Lexem)
                common.setNewEqu(line.label.Lexem, line.operands.operand1.operandName, line.operands.operand1.operandName)
                return {str: equString(line, index, opName)}
            }
            common.updateIdentifierInfo(line.label.Lexem)
            common.setNewEqu(line.label.Lexem, line.operands.operand1.operandName, line.operands.operand1.operandName)
            return {str: sourceString(line, index)}

        }

        //If it is declaration of variable
        if (isVarDeclaration(line)) {
            let operandsSize = ''
            const varName = line.label.Lexem
            const varSize = defineVariableSize(line.mnemocode.Lexem, line.operands.operand1.operandName)

            operandsSize = operandsCalc(line.operands)
            if (getImmCapacity(operandsSize, t.hex) > varSize) {
                return {str: customErrorMsg(line, index, t.tooBigOperand)}
            }

            common.setIsVar(varName, varSize)

            common.setNewVariable(varName, varSize, operandsSize, line.mnemocode.Lexem)
            common.updateIdentifierInfo(varName)

            out = currentDisplacementWithCommandSizeStr(line, index, varSize)
            common.addSizeToDisplacement(varSize)

            return {str: out, prevDisplacement}
        }

        //Normal
        if (line?.mnemocode?.Type === t.instruction) {
            const mnemo = line.mnemocode.Lexem
            const mnemoSize = Commands[mnemo].getSize(line?.operands)

            if (mnemoSize !== t.errorOfOperand
                && mnemoSize !== t.incompatibleOperands
                && mnemoSize !== t.needSize) {
                out = {str: currentDisplacementWithCommandSizeStr(line, index, mnemoSize), prevDisplacement}
                common.addSizeToDisplacement(mnemoSize)
            } else
                out = {str: customErrorMsg(line, index, mnemoSize)}

            return out
        }

    } catch (e) {
        console.error(e)
    }
    return {str: customErrorMsg(line, index, 'SOME_ERROR_WAS_OCCURRED')}
}
