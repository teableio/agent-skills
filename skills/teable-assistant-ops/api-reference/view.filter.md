# View Filter Configuration

## Table of Contents
- [Filter Structure](#filter-structure) — filterSet + conjunction
- [Operators by Cell Value Type](#operators-by-cell-value-type) — string, number, datetime, boolean
- [Operators by Special Field Type](#operators-by-special-field-type) — select, user, link, attachment
- [Dynamic Fields](#dynamic-fields-formula-rollup-lookup) — formula, rollup, lookup
- [Key Rules](#key-rules) — isMultipleCellValue impact, operator meanings
- [Examples](#examples) — basic, AND, multi-select, date, empty check

Filters show only records matching conditions. Supported operators depend on field type and `isMultipleCellValue`.

## Filter Structure

```typescript
{
  filterSet: [
    { fieldId: "fldXXX", operator: "is", value: "Active" }
  ],
  conjunction: "and"  // "and" | "or"
}
```

## Operators by Cell Value Type

### String Fields
```typescript
"is" | "isNot" | "contains" | "doesNotContain" | "isEmpty" | "isNotEmpty"
```
**Applies to**: singleLineText, longText

### Number Fields
```typescript
"is" | "isNot" | "isGreater" | "isGreaterEqual" | "isLess" | "isLessEqual" | "isEmpty" | "isNotEmpty"
```
**Applies to**: number, rating, autoNumber

### DateTime Fields
```typescript
"is" | "isNot" | "isWithIn" | "isBefore" | "isAfter" | "isOnOrBefore" | "isOnOrAfter" | "isEmpty" | "isNotEmpty"
```
**Applies to**: date, createdTime, lastModifiedTime

### Boolean Fields
```typescript
"is"
```
**Applies to**: checkbox

## Operators by Special Field Type

### SingleSelect (Single Value)
```typescript
"is" | "isNot" | "isAnyOf" | "isNoneOf" | "isEmpty" | "isNotEmpty"
```
**When `isMultipleCellValue: false`** (normal singleSelect)

### SingleSelect (Multiple Values)
```typescript
"hasAnyOf" | "hasAllOf" | "isExactly" | "isNotExactly" | "hasNoneOf" | "isEmpty" | "isNotEmpty"
```
**When `isMultipleCellValue: true`** (lookup of singleSelect)  
Note: Uses "hasAnyOf", "hasAllOf", "isExactly" instead of "is", "contains"

### MultipleSelect
```typescript
"hasAnyOf" | "hasAllOf" | "isExactly" | "isNotExactly" | "hasNoneOf" | "isEmpty" | "isNotEmpty"
```
Note: Always uses "has" operators for array matching

### User (Single)
```typescript
"is" | "isNot" | "isAnyOf" | "isNoneOf" | "isEmpty" | "isNotEmpty"
```
**When `isMultipleCellValue: false`**  
Applies to: user, createdBy, lastModifiedBy

### User (Multiple)
```typescript
"hasAnyOf" | "hasAllOf" | "isExactly" | "hasNoneOf" | "isNotExactly" | "isEmpty" | "isNotEmpty"
```
**When `isMultipleCellValue: true`**  
Note: Uses "has" operators instead of "is" operators

### Link (Single)
```typescript
"is" | "isNot" | "isAnyOf" | "isNoneOf" | "contains" | "doesNotContain" | "isEmpty" | "isNotEmpty"
```
**When `isMultipleCellValue: false`** (OneOne, ManyOne relationships)

### Link (Multiple)
```typescript
"hasAnyOf" | "hasAllOf" | "isExactly" | "hasNoneOf" | "isNotExactly" | "contains" | "doesNotContain" | "isEmpty" | "isNotEmpty"
```
**When `isMultipleCellValue: true`** (OneMany, ManyMany relationships)  
Note: Includes "contains" for title text search

### Attachment
```typescript
"isEmpty" | "isNotEmpty"
```

## Dynamic Fields (Formula, Rollup, Lookup)

**Operators depend on their cellValueType**:

- **Formula/Rollup with Number result** → Use Number operators
- **Formula/Rollup with String result** → Use String operators
- **Formula/Rollup with DateTime result** → Use DateTime operators
- **Formula/Rollup with Boolean result** → Use Boolean operators
- **Lookup** → Depends on looked-up field's type and `isMultipleCellValue`

Example:
```typescript
// Formula field: {Price} * {Quantity} (returns number)
{ fieldId: "fldTotal", operator: "isGreater", value: 100 }

// Rollup field: CONCATENATE(values) (returns string)
{ fieldId: "fldNames", operator: "contains", value: "John" }
```

## Key Rules

1. **`isMultipleCellValue` impact**: 
   - `false`: Uses "is", "isNot", "isAnyOf", "isNoneOf"
   - `true`: Uses "hasAnyOf", "hasAllOf", "isExactly", "hasNoneOf", "isNotExactly"

2. **Operator meanings**:
   - "is/isNot": Single value exact match
   - "isAnyOf/isNoneOf": Single value in/not in array
   - "hasAnyOf/hasAllOf/hasNoneOf": Array contains any/all/none
   - "isExactly/isNotExactly": Array exact match/mismatch
   - "contains/doesNotContain": Text or title search

3. **Formula/Rollup/Lookup fields**: Check their `cellValueType` and `isMultipleCellValue` to determine available operators

## Examples

### Basic Filter
```typescript
{ filterSet: [{ fieldId: "fldStatus", operator: "is", value: "Active" }] }
```

### Multiple Conditions (AND)
```typescript
{
  filterSet: [
    { fieldId: "fldStatus", operator: "is", value: "Active" },
    { fieldId: "fldPriority", operator: "isGreater", value: 3 }
  ],
  conjunction: "and"
}
```

### Multiple Select Field
```typescript
{ filterSet: [{ fieldId: "fldTags", operator: "hasAnyOf", value: ["Bug", "Feature"] }] }
```

### Date Relative Filter
```typescript
// Simple string value (no timeZone needed)
{ filterSet: [{ fieldId: "fldDate", operator: "isWithIn", value: "pastWeek" }] }
// Object value with mode (timeZone auto-filled from user context if omitted)
{ filterSet: [{ fieldId: "fldDate", operator: "isWithIn", value: { mode: "pastNumberOfDays", numberOfDays: 7, timeZone: "Asia/Shanghai" } }] }
```

### Empty Check
```typescript
{ filterSet: [{ fieldId: "fldAssignee", operator: "isEmpty" }] }
```
