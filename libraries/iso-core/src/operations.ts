


// ----------------------------------------------------------------------------- NOOP

export const noop = () => {};

// ----------------------------------------------------------------------------- COMPARE

export type TCompareOperators = ('==='|'=='|'!=='|'!='|'>='|'>'|'<='|'<');

export function compareWithOperator ( operandA, operandB, operator:TCompareOperators )
{
	if ( operator == '===' )
		return operandA === operandB;

	else if ( operator == '==' )
		return operandA == operandB;

	else if ( operator == '!==' )
		return operandA !== operandB;

	else if ( operator == '!=' )
		return operandA != operandB;

	else if ( operator == '>=' )
		return operandA >= operandB;

	else if ( operator == '>' )
		return operandA > operandB;

	else if ( operator == '<=' )
		return operandA >= operandB;

	else if ( operator == '<' )
		return operandA < operandB;

	else
		return false
}

// -----------------------------------------------------------------------------